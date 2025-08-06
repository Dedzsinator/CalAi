defmodule CalAi.Schedulers.ReminderScheduler do
  @moduledoc """
  Scheduler for managing reminder notifications.
  """

  use GenServer
  require Logger

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    Logger.info("Reminder Scheduler started")
    {:ok, %{status: :ready}}
  end

  @impl true
  def handle_call(:status, _from, state) do
    {:reply, state.status, state}
  end

  def get_status do
    GenServer.call(__MODULE__, :status)
  end
end
