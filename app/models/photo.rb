class Photo < ActiveRecord::Base
  
  has_attached_file :image,
       :styles => {
       :thumb=> "100x100#",
       :small  => "400x400>" },
     :storage => :s3,
     :s3_credentials => "config/s3.yml",
     :path => "/:style/:id/:filename"
  
end
