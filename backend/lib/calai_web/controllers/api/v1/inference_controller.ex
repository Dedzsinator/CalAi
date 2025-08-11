defmodule CalAiWeb.Api.V1.InferenceController do
  @moduledoc """
  Controller for AI inference operations including food classification,
  nutrition estimation, and OCR text extraction.
  """

  use CalAiWeb, :controller

  require Logger
  alias CalAi.Services.{FoodRecognition, OpenFoodFacts}

  action_fallback(CalAiWeb.FallbackController)

  @doc """
  Classify food from an image using AI with enhanced accuracy.

  Expects a POST request with image data and returns Food-101 classifications
  enhanced with OpenFoodFacts nutrition data.
  """
  def classify_food(conn, %{"image" => image_params} = _params) do
    start_time = System.monotonic_time(:millisecond)

    Logger.info("Enhanced food classification request received")

    # Extract image data from upload
    with {:ok, image_data} <- extract_image_data(image_params),
         {:ok, result} <-
           FoodRecognition.classify_food_image(image_data,
             max_predictions: 5,
             use_fallback: true
           ) do
      processing_time = System.monotonic_time(:millisecond) - start_time

      enhanced_result = %{
        predictions: result.predictions,
        processing_time_ms: processing_time,
        model_version: result.model || "food-101-v1.0",
        cached: result[:cached] || false,
        enhanced: result[:enhanced] || false,
        fallback_used: result[:fallback] || false,
        confidence_threshold: 0.1
      }

      conn
      |> put_status(:ok)
      |> render(:classify_food, classification: enhanced_result)
    else
      {:error, :invalid_image} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid image format", success: false})

      {:error, :api_error} ->
        conn
        |> put_status(:service_unavailable)
        |> json(%{error: "AI service temporarily unavailable", success: false})

      {:error, reason} ->
        Logger.error("Enhanced food classification failed: #{inspect(reason)}")

        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Classification failed", success: false})
    end
  end

  @doc """
  Estimate nutrition information from food image.

  Expects a POST request with image data and optional food context.
  """
  def estimate_nutrition(conn, %{"image" => image_params} = params) do
    food_context = Map.get(params, "food_context", %{})
    start_time = System.monotonic_time(:millisecond)

    Logger.info("Nutrition estimation request received")

    # First classify the food, then enhance with detailed nutrition
    with {:ok, image_data} <- extract_image_data(image_params),
         {:ok, classification_result} <-
           FoodRecognition.classify_food_image(image_data, max_predictions: 1) do
      case classification_result.predictions do
        [top_prediction | _] ->
          # Get detailed nutrition data for the top prediction
          detailed_nutrition = get_detailed_nutrition(top_prediction, food_context)

          processing_time = System.monotonic_time(:millisecond) - start_time

          nutrition_result = %{
            total_nutrition: detailed_nutrition.nutrition,
            portion_analysis: %{
              estimated_weight_g: detailed_nutrition.estimated_weight,
              confidence: top_prediction.confidence,
              serving_description: top_prediction.portion_estimate
            },
            food_items: [
              %{
                name: top_prediction.food_name,
                weight_g: detailed_nutrition.estimated_weight,
                confidence: top_prediction.confidence
              }
            ],
            processing_time_ms: processing_time
          }

          conn
          |> put_status(:ok)
          |> render(:estimate_nutrition, nutrition: nutrition_result)

        [] ->
          conn
          |> put_status(:unprocessable_entity)
          |> json(%{error: "Could not identify food in image", success: false})
      end
    else
      {:error, reason} ->
        Logger.error("Nutrition estimation failed: #{inspect(reason)}")

        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Nutrition estimation failed", success: false})
    end
  end

  @doc """
  Extract text from food labels using OCR.

  Expects a POST request with image data.
  """
  def extract_text(conn, %{"image" => image_params} = params) do
    user = conn.assigns.current_user

    Logger.info("OCR text extraction request from user #{user.id}")

    # TODO: Implement OCR text extraction
    # This would involve:
    # 1. Preprocessing image for OCR
    # 2. Running OCR service
    # 3. Post-processing and structuring extracted text
    # 4. Identifying nutrition facts if present

    ocr_result = %{
      extracted_text:
        "Nutrition Facts\nServing Size: 100g\nCalories: 250\nTotal Fat: 12g\nSaturated Fat: 3g\nCholesterol: 0mg\nSodium: 300mg\nTotal Carbs: 30g\nDietary Fiber: 5g\nSugars: 8g\nProtein: 10g",
      structured_data: %{
        nutrition_facts: %{
          serving_size: "100g",
          calories: 250,
          total_fat: 12.0,
          saturated_fat: 3.0,
          cholesterol: 0.0,
          sodium: 300.0,
          total_carbs: 30.0,
          dietary_fiber: 5.0,
          sugars: 8.0,
          protein: 10.0
        }
      },
      confidence: 0.92,
      processing_time_ms: 180
    }

    conn
    |> put_status(:ok)
    |> render(:extract_text, ocr: ocr_result)
  end

  # Private helper functions

  defp extract_image_data(%Plug.Upload{path: path}) do
    case File.read(path) do
      {:ok, data} -> {:ok, data}
      {:error, _} -> {:error, :invalid_image}
    end
  end

  defp extract_image_data(%{"path" => path}) when is_binary(path) do
    case File.read(path) do
      {:ok, data} -> {:ok, data}
      {:error, _} -> {:error, :invalid_image}
    end
  end

  defp extract_image_data(base64_data) when is_binary(base64_data) do
    try do
      case Base.decode64(base64_data) do
        {:ok, data} -> {:ok, data}
        :error -> {:error, :invalid_image}
      end
    rescue
      _ -> {:error, :invalid_image}
    end
  end

  defp extract_image_data(_), do: {:error, :invalid_image}

  defp get_detailed_nutrition(prediction, food_context) do
    # Extract portion information from context or estimate
    portion_weight =
      Map.get(
        food_context,
        "estimated_weight",
        estimate_weight_from_portion(prediction.portion_estimate)
      )

    # Calculate nutrition based on portion size (predictions are usually per 100g)
    multiplier = portion_weight / 100.0

    %{
      nutrition: %{
        calories: round((prediction.calories || 0) * multiplier),
        protein: Float.round((prediction.protein || 0) * multiplier, 1),
        carbs: Float.round((prediction.carbs || 0) * multiplier, 1),
        fat: Float.round((prediction.fat || 0) * multiplier, 1),
        fiber: Float.round((prediction.fiber || 0) * multiplier, 1),
        sugar: Float.round((prediction.sugar || 0) * multiplier, 1),
        sodium: Float.round((prediction[:sodium] || 0) * multiplier, 1)
      },
      estimated_weight: portion_weight
    }
  end

  defp estimate_weight_from_portion(portion_description) do
    portion_lower = String.downcase(portion_description || "100g")

    cond do
      String.contains?(portion_lower, "slice") ->
        120

      String.contains?(portion_lower, "cup") ->
        150

      String.contains?(portion_lower, "piece") ->
        200

      String.contains?(portion_lower, "medium") ->
        180

      String.contains?(portion_lower, "large") ->
        250

      String.contains?(portion_lower, "small") ->
        80

      String.contains?(portion_lower, "serving") ->
        150

      String.match?(portion_lower, ~r/(\d+)g/) ->
        case Regex.run(~r/(\d+)g/, portion_lower) do
          [_, weight_str] -> String.to_integer(weight_str)
          _ -> 100
        end

      true ->
        100
    end
  end
end
