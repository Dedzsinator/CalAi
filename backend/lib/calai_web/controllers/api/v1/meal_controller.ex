defmodule CalAiWeb.Api.V1.MealController do
  use CalAiWeb, :controller

  alias CalAi.Nutrition
  alias CalAi.Nutrition.Meal
  alias CalAi.Auth.Guardian

  action_fallback(CalAiWeb.FallbackController)

  def index(conn, params) do
    user = Guardian.Plug.current_resource(conn)

    filters = %{
      user_id: user.id,
      date_from: params["date_from"],
      date_to: params["date_to"],
      meal_type: params["meal_type"],
      limit: params["limit"] || 50,
      offset: params["offset"] || 0
    }

    meals = Nutrition.list_user_meals(filters)
    render(conn, :index, meals: meals)
  end

  def show(conn, %{"id" => id}) do
    user = Guardian.Plug.current_resource(conn)

    case Nutrition.get_user_meal(user.id, id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> render(:error, %{message: "Meal not found"})

      meal ->
        render(conn, :show, meal: meal)
    end
  end

  def create(conn, %{"meal" => meal_params}) do
    user = Guardian.Plug.current_resource(conn)
    meal_params = Map.put(meal_params, "user_id", user.id)

    with {:ok, %Meal{} = meal} <- Nutrition.create_meal(meal_params) do
      # Process image if provided
      if meal_params["image"] do
        CalAi.Jobs.ProcessMealImageJob.new(%{meal_id: meal.id, image_data: meal_params["image"]})
        |> Oban.insert()
      end

      conn
      |> put_status(:created)
      |> render(:show, meal: meal)
    end
  end

  def update(conn, %{"id" => id, "meal" => meal_params}) do
    user = Guardian.Plug.current_resource(conn)

    case Nutrition.get_user_meal(user.id, id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> render(:error, %{message: "Meal not found"})

      meal ->
        case Nutrition.update_meal(meal, meal_params) do
          {:ok, meal} ->
            render(conn, :show, meal: meal)

          {:error, %Ecto.Changeset{} = changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> render(:error, changeset: changeset)
        end
    end
  end

  def delete(conn, %{"id" => id}) do
    user = Guardian.Plug.current_resource(conn)

    case Nutrition.get_user_meal(user.id, id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> render(:error, %{message: "Meal not found"})

      meal ->
        case Nutrition.delete_meal(meal) do
          {:ok, _meal} ->
            send_resp(conn, :no_content, "")

          {:error, %Ecto.Changeset{} = changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> render(:error, changeset: changeset)
        end
    end
  end

  def analyze_image(conn, %{"image" => image_params}) do
    user = Guardian.Plug.current_resource(conn)

    # Process image with AI
    case CalAi.AI.FoodRecognition.analyze_image(image_params) do
      {:ok, analysis} ->
        render(conn, :analysis, analysis: analysis)

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, %{message: "Failed to analyze image: #{reason}"})
    end
  end
end
