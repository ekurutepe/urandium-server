class AddLngToPhotos < ActiveRecord::Migration
  def change
    add_column :photos, :lng, :float
  end
end
