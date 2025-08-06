defmodule CalAi.Repo.Migrations.CreateFoods do
  use Ecto.Migration

  def up do
    create table(:foods, primary_key: false) do
      add(:id, :binary_id, primary_key: true)
      add(:name, :string, null: false)
      add(:brand, :string)
      add(:barcode, :string)
      add(:category, :string, null: false)
      add(:subcategory, :string)
      add(:description, :text)

      # Nutritional information per 100g
      add(:calories_per_100g, :integer, null: false)
      add(:protein_per_100g, :float, default: 0.0, null: false)
      add(:carbs_per_100g, :float, default: 0.0, null: false)
      add(:fat_per_100g, :float, default: 0.0, null: false)
      add(:fiber_per_100g, :float, default: 0.0)
      add(:sugar_per_100g, :float, default: 0.0)
      add(:sodium_per_100g, :float, default: 0.0)

      # Additional nutrients
      add(:vitamins, :map, default: %{})
      add(:minerals, :map, default: %{})
      add(:allergens, {:array, :string}, default: [])

      # Metadata
      add(:serving_size_g, :float)
      add(:serving_description, :string)
      add(:confidence_score, :float, default: 1.0)
      add(:source, :string, null: false)
      add(:data_quality, :string, default: "medium", null: false)
      add(:image_url, :string)
      add(:verified, :boolean, default: false, null: false)

      # Search and ML features
      add(:search_vector, :text)
      add(:embedding, {:array, :float})

      timestamps()
    end

    create(unique_index(:foods, [:barcode], where: "barcode IS NOT NULL"))
    create(index(:foods, [:category]))
    create(index(:foods, [:brand]))
    create(index(:foods, [:verified]))
    create(index(:foods, [:name]))
    create(index(:foods, [:search_vector]))

    # Full-text search index
    execute("""
    CREATE INDEX foods_search_vector_gin_idx ON foods
    USING gin(to_tsvector('english', search_vector))
    """)
  end

  def down do
    execute("DROP INDEX IF EXISTS foods_search_vector_gin_idx")
    drop(table(:foods))
  end
end
