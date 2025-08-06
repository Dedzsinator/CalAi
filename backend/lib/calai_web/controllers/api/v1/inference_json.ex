defmodule CalAiWeb.Api.V1.InferenceJSON do
  @moduledoc """
  JSON views for AI inference operations.
  """

  @doc """
  Renders food classification results.
  """
  def classify_food(%{classification: classification}) do
    %{
      success: true,
      data: %{
        predictions: render_predictions(classification.predictions),
        processing_time_ms: classification.processing_time_ms,
        model_version: classification.model_version
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
