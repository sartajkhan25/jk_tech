const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const Document = require('../models/document.model');
const { auth, checkRole } = require('../middleware/auth.middleware');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
  console.log("🚀 ~ storage:", storage)

router.post('/upload',
  auth,
  upload.single('document'),
  [
    body('title').trim().notEmpty(),
    body('description').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        console.log("🚀 ~ document:", document)
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const document = new Document({
        title: req.body.title,
        description: req.body.description,
        fileUrl: req.file.path,
        fileType: path.extname(req.file.originalname),
        fileSize: req.file.size,
        uploadedBy: req.user._id
      });

      await document.save();
      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ message: 'Error uploading document' });
    }
  }
);

router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find()
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name email');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching document' });
  }
});

router.patch('/:id/status',
  auth,
  checkRole(['admin', 'editor']),
  [
    body('status').isIn(['pending', 'processing', 'completed', 'failed']),
    body('ingestionStatus').isIn(['not_started', 'in_progress', 'completed', 'failed'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, ingestionStatus } = req.body;
      const document = await Document.findByIdAndUpdate(
        req.params.id,
        { status, ingestionStatus },
        { new: true }
      );

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json(document);
    } catch (error) {
      res.status(500).json({ message: 'Error updating document status' });
    }
  }
);

router.delete('/:id',
  auth,
  checkRole(['admin', 'editor']),
  async (req, res) => {
    try {
      const document = await Document.findByIdAndDelete(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting document' });
    }
  }
);

module.exports = router; 