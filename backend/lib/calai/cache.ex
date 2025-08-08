defmodule CalAi.Cache do
  @moduledoc """
  Redis-based caching layer for CalAi application.
  """

  require Logger

  # 5 minutes
  @default_expiry 300
  # 15 minutes
  @search_cache_expiry 900
  # 1 hour
  @analytics_cache_expiry 3600

  @doc """
  Get a value from cache.
  """
  def get(key) when is_binary(key) do
    case Redix.command(:redix, ["GET", cache_key(key)]) do
      {:ok, nil} ->
        {:miss, nil}

      {:ok, value} ->
        {:ok, Jason.decode!(value)}

      {:error, reason} ->
        Logger.warning("Cache get failed for key #{key}: #{inspect(reason)}")
        {:miss, nil}
    end
  end

  @doc """
  Set a value in cache with optional expiry.
  """
  def put(key, value, expiry \\ @default_expiry) when is_binary(key) do
    json_value = Jason.encode!(value)

    case Redix.command(:redix, ["SETEX", cache_key(key), expiry, json_value]) do
      {:ok, "OK"} ->
        :ok

      {:error, reason} ->
        Logger.warning("Cache put failed for key #{key}: #{inspect(reason)}")
        :error
    end
  end

  @doc """
  Delete a value from cache.
  """
  def delete(key) when is_binary(key) do
    case Redix.command(:redix, ["DEL", cache_key(key)]) do
      {:ok, _count} ->
        :ok

      {:error, reason} ->
        Logger.warning("Cache delete failed for key #{key}: #{inspect(reason)}")
        :error
    end
  end

  @doc """
  Cache search results.
  """
  def cache_search(query, category, results) do
    key = search_cache_key(query, category)
    put(key, results, @search_cache_expiry)
  end

  @doc """
  Get cached search results.
  """
  def get_cached_search(query, category) do
    key = search_cache_key(query, category)
    get(key)
  end

  @doc """
  Cache analytics data.
  """
  def cache_analytics(user_id, period, data) do
    key = analytics_cache_key(user_id, period)
    put(key, data, @analytics_cache_expiry)
  end

  @doc """
  Get cached analytics data.
  """
  def get_cached_analytics(user_id, period) do
    key = analytics_cache_key(user_id, period)
    get(key)
  end

  @doc """
  Invalidate user-specific cache patterns.
  """
  def invalidate_user_cache(user_id) do
    patterns = [
      "calai:analytics:#{user_id}:*",
      "calai:meals:#{user_id}:*"
    ]

    Enum.each(patterns, &invalidate_pattern/1)
  end

  @doc """
  Cache food barcode lookup.
  """
  def cache_barcode(barcode, data) do
    key = "barcode:#{barcode}"
    # 24 hours for barcode data
    put(key, data, 86400)
  end

  @doc """
  Get cached barcode data.
  """
  def get_cached_barcode(barcode) do
    key = "barcode:#{barcode}"
    get(key)
  end

  # Private functions

  defp cache_key(key) do
    "calai:#{key}"
  end

  defp search_cache_key(query, category) do
    category_part = if category, do: ":#{category}", else: ""
    "search:#{String.downcase(query)}#{category_part}"
  end

  defp analytics_cache_key(user_id, period) do
    "analytics:#{user_id}:#{period}"
  end

  defp invalidate_pattern(pattern) do
    case Redix.command(:redix, ["KEYS", cache_key(pattern)]) do
      {:ok, keys} when is_list(keys) ->
        if keys != [] do
          Redix.command(:redix, ["DEL"] ++ keys)
        end

      {:error, reason} ->
        Logger.warning("Failed to invalidate cache pattern #{pattern}: #{inspect(reason)}")
    end
  end
end
