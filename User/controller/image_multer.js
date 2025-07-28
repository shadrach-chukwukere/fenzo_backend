// User/controller/image_multer.js
const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  const imageUrl = `${req.protocol}://${req.get('host')}/assets/${req.file.filename}`;
  res.status(200).json({ message: 'Image uploaded successfully', imageUrl });
};

export default uploadImage;
