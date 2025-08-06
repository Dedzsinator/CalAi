defmodule CalAiWeb.Api.V1.JobController do
  use CalAiWeb, :controller

  alias CalAi.Jobs
  alias CalAi.Jobs.Job
  alias CalAi.Repo

  import Ecto.Query

  action_fallback(CalAiWeb.FallbackController)

  def index(conn, params) do
    user_id = conn.assigns.current_user.id

    query =
      from(j in Job,
        where: j.user_id == ^user_id,
        order_by: [desc: j.inserted_at]
      )

    query =
      case params["status"] do
        status when status in ["pending", "processing", "completed", "failed"] ->
          from(j in query, where: j.status == ^status)

        _ ->
          query
      end

    query =
      case params["job_type"] do
        job_type when is_binary(job_type) ->
          from(j in query, where: j.job_type == ^job_type)

        _ ->
          query
      end

    page = String.to_integer(params["page"] || "1")
    per_page = min(String.to_integer(params["per_page"] || "20"), 100)

    jobs =
      query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    total = Repo.aggregate(query, :count)

    conn
    |> put_status(:ok)
    |> json(%{
      success: true,
      data: jobs,
      pagination: %{
        page: page,
        per_page: per_page,
        total: total,
        total_pages: ceil(total / per_page)
      }
    })
  end

  def show(conn, %{"id" => id}) do
    user_id = conn.assigns.current_user.id

    case Jobs.get_user_job(user_id, id) do
      %Job{} = job ->
        conn
        |> put_status(:ok)
        |> json(%{success: true, data: job})

      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{success: false, message: "Job not found"})
    end
  end

  def create(conn, params) do
    user_id = conn.assigns.current_user.id

    job_params =
      params
      |> Map.put("user_id", user_id)
      |> Map.put("status", "pending")
      |> Map.put_new("priority", 5)

    case Jobs.create_job(job_params) do
      {:ok, job} ->
        # Queue the job for processing
        case job.job_type do
          "food_recognition" ->
            Jobs.queue_food_recognition_job(job)

          "batch_meal_analysis" ->
            Jobs.queue_batch_analysis_job(job)

          "nutrition_report" ->
            Jobs.queue_nutrition_report_job(job)

          "data_export" ->
            Jobs.queue_data_export_job(job)

          _ ->
            Jobs.queue_generic_job(job)
        end

        conn
        |> put_status(:created)
        |> json(%{success: true, data: job})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{
          success: false,
          message: "Failed to create job",
          errors: format_changeset_errors(changeset)
        })
    end
  end

  def cancel(conn, %{"id" => id}) do
    user_id = conn.assigns.current_user.id

    case Jobs.get_user_job(user_id, id) do
      %Job{status: status} = job when status in ["pending", "processing"] ->
        case Jobs.cancel_job(job) do
          {:ok, job} ->
            conn
            |> put_status(:ok)
            |> json(%{success: true, data: job})

          {:error, changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              success: false,
              message: "Failed to cancel job",
              errors: format_changeset_errors(changeset)
            })
        end

      %Job{status: status} ->
        conn
        |> put_status(:bad_request)
        |> json(%{
          success: false,
          message: "Cannot cancel job with status: #{status}"
        })

      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{success: false, message: "Job not found"})
    end
  end

  def retry(conn, %{"id" => id}) do
    user_id = conn.assigns.current_user.id

    case Jobs.get_user_job(user_id, id) do
      %Job{status: "failed"} = job ->
        case Jobs.retry_job(job) do
          {:ok, job} ->
            # Re-queue the job
            case job.job_type do
              "food_recognition" ->
                Jobs.queue_food_recognition_job(job)

              "batch_meal_analysis" ->
                Jobs.queue_batch_analysis_job(job)

              "nutrition_report" ->
                Jobs.queue_nutrition_report_job(job)

              "data_export" ->
                Jobs.queue_data_export_job(job)

              _ ->
                Jobs.queue_generic_job(job)
            end

            conn
            |> put_status(:ok)
            |> json(%{success: true, data: job})

          {:error, changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              success: false,
              message: "Failed to retry job",
              errors: format_changeset_errors(changeset)
            })
        end

      %Job{status: status} ->
        conn
        |> put_status(:bad_request)
        |> json(%{
          success: false,
          message: "Cannot retry job with status: #{status}. Only failed jobs can be retried."
        })

      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{success: false, message: "Job not found"})
    end
  end

  def bulk_create(conn, %{"jobs" => jobs_params}) when is_list(jobs_params) do
    user_id = conn.assigns.current_user.id

    # Validate job count
    if length(jobs_params) > 50 do
      conn
      |> put_status(:bad_request)
      |> json(%{
        success: false,
        message: "Maximum 50 jobs can be created at once"
      })
    else
      jobs_with_user =
        jobs_params
        |> Enum.map(fn job_params ->
          job_params
          |> Map.put("user_id", user_id)
          |> Map.put("status", "pending")
          |> Map.put_new("priority", 5)
        end)

      case Jobs.create_jobs(jobs_with_user) do
        {:ok, jobs} ->
          # Queue all jobs
          Enum.each(jobs, fn job ->
            case job.job_type do
              "food_recognition" ->
                Jobs.queue_food_recognition_job(job)

              "batch_meal_analysis" ->
                Jobs.queue_batch_analysis_job(job)

              "nutrition_report" ->
                Jobs.queue_nutrition_report_job(job)

              "data_export" ->
                Jobs.queue_data_export_job(job)

              _ ->
                Jobs.queue_generic_job(job)
            end
          end)

          conn
          |> put_status(:created)
          |> json(%{
            success: true,
            data: jobs,
            message: "#{length(jobs)} jobs created successfully"
          })

        {:error, errors} ->
          conn
          |> put_status(:unprocessable_entity)
          |> json(%{
            success: false,
            message: "Failed to create some jobs",
            errors: errors
          })
      end
    end
  end

  def bulk_create(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{
      success: false,
      message: "jobs parameter must be an array"
    })
  end

  def stats(conn, _params) do
    user_id = conn.assigns.current_user.id

    stats = Jobs.get_user_job_stats(user_id)

    conn
    |> put_status(:ok)
    |> json(%{success: true, data: stats})
  end

  defp format_changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
