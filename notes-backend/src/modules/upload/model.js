import fs from 'fs';
import path from 'path';

class UploadModel {
  constructor() {
    this.uploadDir = 'public/images';
  }

  ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  sanitizeFilename(originalname) {
    const safeName = path.basename(originalname || 'image.png');

    return safeName
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .toLowerCase();
  }

  splitFilename(filename) {
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);

    return {
      name,
      ext
    };
  }

  buildCandidateFilename(filename, number) {
    if (number === 0) {
      return filename;
    }

    const { name, ext } = this.splitFilename(filename);
    const suffix = String(number).padStart(4, '0');

    return `${name}_${suffix}${ext}`;
  }

  getFileSize(filePath) {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stat = fs.statSync(filePath);

    return stat.size;
  }

  resolveFilename(originalname, uploadedSize) {
    this.ensureUploadDir();

    const safeFilename = this.sanitizeFilename(originalname);
    let counter = 0;

    while (true) {
      const candidateFilename = this.buildCandidateFilename(
        safeFilename,
        counter
      );

      const candidatePath = path.join(this.uploadDir, candidateFilename);
      const existingSize = this.getFileSize(candidatePath);

      if (existingSize === null) {
        return {
          filename: candidateFilename,
          filepath: candidatePath,
          shouldWrite: true,
          reused: false
        };
      }

      if (existingSize === uploadedSize) {
        return {
          filename: candidateFilename,
          filepath: candidatePath,
          shouldWrite: false,
          reused: true
        };
      }

      counter += 1;
    }
  }

  saveImage(file) {
    const result = this.resolveFilename(
      file.originalname,
      file.size
    );

    if (result.shouldWrite) {
      fs.writeFileSync(result.filepath, file.buffer);
    }

    return {
      filename: result.filename,
      imageUrl: this.buildImageUrl(result.filename),
      reused: result.reused
    };
  }

  buildImageUrl(filename) {
    return `/images/${filename}`;
  }
}

export const uploadModel = new UploadModel();