defmodule CalAi.Jobs.Job do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "jobs" do
    field(:type, :string)
    field(:status, :string)
    field(:priority, :integer, default: 5)
    field(:scheduled_at, :naive_datetime)
    field(:started_at, :naive_datetime)
    field(:completed_at, :naive_datetime)
    field(:failed_at, :naive_datetime)
    field(:attempts, :integer, default: 0)
    field(:max_attempts, :integer, default: 3)
    field(:errors, {:array, :string}, default: [])
    field(:result, :map)
    field(:meta, :map, default: %{})

    belongs_to(:user, CalAi.Accounts.User)

    timestamps()
  end

  @doc false
  def changeset(job, attrs) do
    job
    |> cast(attrs, [
      :type,
      :status,
      :priority,
      :scheduled_at,
      :started_at,
      :completed_at,
      :failed_at,
      :attempts,
      :max_attempts,
      :errors,
      :result,
      :meta,
      :user_id
    ])
    |> validate_required([:type, :status])
    |> validate_inclusion(:status, ["pending", "processing", "completed", "failed"])
    |> validate_number(:priority, greater_than: 0, less_than: 11)
    |> validate_number(:attempts, greater_than_or_equal_to: 0)
    |> validate_number(:max_attempts, greater_than: 0)
  end
end
