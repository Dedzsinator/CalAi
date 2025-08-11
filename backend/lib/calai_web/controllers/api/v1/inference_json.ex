defmodule CalAiWeb.Api.V1.InferenceJSON do
  @moduledoc """
  JSON views for AI inference operations.
  """

  @doc """
  Renders enhanced food classification results with OpenFoodFacts integration.
  """
  def classify_food(%{classification: classification}) do
    %{
      success: true,
      data: %{
        predictions: render_enhanced_predictions(classification.predictions),
        processing_time_ms: classification.processing_time_ms,
        model_version: classification.model_version,
        cached: classification[:cached] || false,
        enhanced: classification[:enhanced] || false,
        fallback_used: classification[:fallback_used] || false,
        confidence_threshold: classification[:confidence_threshold] || 0.1
      }
    }
  end

  @doc """
  Renders nutrition estimation results.
  """
  def estimate_nutrition(%{nutrition: nutrition}) do
    %{
      success: true,
      data: %{
        total_nutrition: nutrition.total_nutrition,
        portion_analysis: nutrition.portion_analysis,
        food_items: nutrition.food_items,
        processing_time_ms: nutrition.processing_time_ms
      }
    }
  end

  @doc """
  Renders OCR text extraction results.
  """
  def extract_text(%{ocr: ocr}) do
    %{
      success: true,
      data: %{
        extracted_text: ocr.extracted_text,
        structured_data: ocr.structured_data,
        confidence: ocr.confidence,
        processing_time_ms: ocr.processing_time_ms
      }
    }
  end

  # Private helper functions

  defp render_enhanced_predictions(predictions) do
    Enum.map(predictions, fn prediction ->
      %{
        food_name: prediction[:food_name] || prediction.food_name,
        confidence: prediction[:confidence] || prediction.confidence,
        calories: prediction[:calories] || prediction.calories || 0,
        protein: prediction[:protein] || prediction.protein || 0,
        carbs: prediction[:carbs] || prediction.carbs || 0,
        fat: prediction[:fat] || prediction.fat || 0,
        fiber: prediction[:fiber] || 0,
        sugar: prediction[:sugar] || 0,
        portion_estimate: prediction[:portion_estimate] || prediction.portion_estimate || "100g",
        image_url: prediction[:image_url],
        source: prediction[:source] || "ai_prediction",
        serving_suggestions: prediction[:serving_suggestions] || [],
        nutritional_density: prediction[:nutritional_density] || "moderate"
      }
    end)
  end

  defp render_predictions(predictions) do
    Enum.map(predictions, fn prediction ->
      %{
        food_name: prediction.food_name,
        confidence: prediction.confidence,
        category: prediction.category,
        nutrition_estimate: prediction.nutrition_estimate
      }
    end)
  end
end
