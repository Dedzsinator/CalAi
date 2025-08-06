defmodule CalAi.Jobs do
  @moduledoc """
  The Jobs context.
  """

  import Ecto.Query, warn: false
  alias CalAi.Repo
  alias CalAi.Jobs.Job

  @doc """
  Returns the list of jobs.

  ## Examples

      iex> list_jobs()
      [%Job{}, ...]

  """
  def list_jobs do
    Repo.all(Job)
  end

  @doc """
  Gets a single job.

  Raises `Ecto.NoResultsError` if the Job does not exist.

  ## Examples

      iex> get_job!(123)
      %Job{}

      iex> get_job!(456)
      ** (Ecto.NoResultsError)

  """
  def get_job!(id), do: Repo.get!(Job, id)

  @doc """
  Gets a single job.

  ## Examples

      iex> get_job(123)
      %Job{}

      iex> get_job(456)
      nil

  """
  def get_job(id), do: Repo.get(Job, id)

  @doc """
  Creates a job.

  ## Examples

      iex> create_job(%{field: value})
      {:ok, %Job{}}

      iex> create_job(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_job(attrs \\ %{}) do
    %Job{}
    |> Job.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a job.

  ## Examples

      iex> update_job(job, %{field: new_value})
      {:ok, %Job{}}

      iex> update_job(job, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_job(%Job{} = job, attrs) do
    job
    |> Job.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a job.

  ## Examples

      iex> delete_job(job)
      {:ok, %Job{}}

      iex> delete_job(job)
      {:error, %Ecto.Changeset{}}

  """
  def delete_job(%Job{} = job) do
    Repo.delete(job)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking job changes.

  ## Examples

      iex> change_job(job)
      %Ecto.Changeset{data: %Job{}}

  """
  def change_job(%Job{} = job, attrs \\ %{}) do
    Job.changeset(job, attrs)
  end

  # Additional functions required by controllers

  @doc """
  Gets a single job for a specific user.
  """
  def get_user_job(user_id, job_id) do
    case Repo.get_by(Job, id: job_id, user_id: user_id) do
      nil -> {:error, :not_found}
      job -> {:ok, job}
    end
  end

  @doc """
  Create multiple jobs at once.
  """
  def create_jobs(jobs_attrs) when is_list(jobs_attrs) do
    jobs_attrs
    |> Enum.map(fn attrs ->
      %Job{}
      |> Job.changeset(attrs)
    end)
    |> Enum.reduce(Ecto.Multi.new(), fn changeset, multi ->
      Ecto.Multi.insert(multi, {:job, System.unique_integer([:positive])}, changeset)
    end)
    |> Repo.transaction()
  end

  @doc """
  Cancel a job.
  """
  def cancel_job(%Job{} = job) do
    # Update job status to cancelled
    update_job(job, %{status: "cancelled"})
  end

  @doc """
  Retry a failed job.
  """
  def retry_job(%Job{} = job) do
    # Reset job status to pending
    update_job(job, %{status: "pending", attempts: 0})
  end

  @doc """
  Get job statistics for a user.
  """
  def get_user_job_stats(user_id) do
    from(j in Job, where: j.user_id == ^user_id)
    |> Repo.aggregate(:count, :id)
    |> then(fn total_count ->
      %{
        total: total_count,
        pending: get_user_job_count_by_status(user_id, "pending"),
        running: get_user_job_count_by_status(user_id, "running"),
        completed: get_user_job_count_by_status(user_id, "completed"),
        failed: get_user_job_count_by_status(user_id, "failed"),
        cancelled: get_user_job_count_by_status(user_id, "cancelled")
      }
    end)
  end

  # Job queueing functions for different job types

  @doc """
  Queue a food recognition job.
  """
  def queue_food_recognition_job(%Job{} = job) do
    # TODO: Add to Oban queue
    require Logger
    Logger.info("Queueing food recognition job: #{job.id}")
    {:ok, job}
  end

  @doc """
  Queue a batch analysis job.
  """
  def queue_batch_analysis_job(%Job{} = job) do
    # TODO: Add to Oban queue
    require Logger
    Logger.info("Queueing batch analysis job: #{job.id}")
    {:ok, job}
  end

  @doc """
  Queue a nutrition report job.
  """
  def queue_nutrition_report_job(%Job{} = job) do
    # TODO: Add to Oban queue
    require Logger
    Logger.info("Queueing nutrition report job: #{job.id}")
    {:ok, job}
  end

  @doc """
  Queue a data export job.
  """
  def queue_data_export_job(%Job{} = job) do
    # TODO: Add to Oban queue
    require Logger
    Logger.info("Queueing data export job: #{job.id}")
    {:ok, job}
  end

  @doc """
  Queue an account deletion job.
  """
  def queue_account_deletion_job(%Job{} = job) do
    # TODO: Add to Oban queue
    require Logger
    Logger.info("Queueing account deletion job: #{job.id}")
    {:ok, job}
  end

  @doc """
  Queue a generic job.
  """
  def queue_generic_job(%Job{} = job) do
    # TODO: Add to Oban queue
    require Logger
    Logger.info("Queueing generic job: #{job.id}")
    {:ok, job}
  end

  # Private helper functions

  defp get_user_job_count_by_status(user_id, status) do
    from(j in Job, where: j.user_id == ^user_id and j.status == ^status)
    |> Repo.aggregate(:count, :id)
  end
end
