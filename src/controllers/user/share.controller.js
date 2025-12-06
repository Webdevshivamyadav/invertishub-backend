const genrateShareableLink = async (req, res) => {
  try {
    const { postId, postType } = req.params;
  const baseUrl = `${process.env.FRONTEND_URL}/user/feed/${postId}/${postType}`;
    return res.status(200).json({ success: true, baseUrl });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  genrateShareableLink
}