import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDirectory = path.resolve(
  process.cwd(),
  "uploads",
  "sia"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (
    _req,
    _file,
    callback
  ) => {
    callback(
      null,
      uploadDirectory
    );
  },

  filename: (
    _req,
    file,
    callback
  ) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const uniqueName =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`;

    callback(
      null,
      uniqueName
    );
  },
});

const allowedExtensions = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
]);

const allowedMimeTypes = new Set([
  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",

  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  // Algunos clientes pueden enviar el archivo
  // con MIME genérico.
  "application/octet-stream",
]);

export const uploadSiaDocument = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (
    _req,
    file,
    callback
  ) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    console.log(
      "Archivo recibido:",
      file.originalname
    );

    console.log(
      "MIME recibido:",
      file.mimetype
    );

    console.log(
      "Extensión:",
      extension
    );

    const extensionPermitida =
      allowedExtensions.has(extension);

    const mimePermitido =
      allowedMimeTypes.has(file.mimetype);

    if (
      extensionPermitida &&
      mimePermitido
    ) {
      callback(null, true);
      return;
    }

    callback(
      new Error(
        "TIPO_ARCHIVO_NO_PERMITIDO"
      )
    );
  },
});