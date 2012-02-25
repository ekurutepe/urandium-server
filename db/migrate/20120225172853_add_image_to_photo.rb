class AddImageToPhoto < ActiveRecord::Migration
  def change
    change_table :photos do |t|
      t.has_attached_file :image
    end
  end
end
