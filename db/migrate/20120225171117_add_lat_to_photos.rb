class AddLatToPhotos < ActiveRecord::Migration
  def change
    add_column :photos, :lat, :float
  end
end
