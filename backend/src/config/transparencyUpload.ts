import multer from "multer";
import path from "path";
import fs from "fs";


const uploadDirectory = path.resolve(
  process.cwd(),
  "uploads",
  "transparencia"
);


if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(
    uploadDirectory,
    {
      recursive: true,
    }
  );
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
  ".csv",
]);


const allowedMimeTypes = new Set([
  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",

  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "text/csv",

  "application/csv",

  "application/octet-stream",
]);


export const uploadTransparencyFile = multer({
  storage,

  limits: {
    fileSize:
      15 * 1024 * 1024,
  },

  fileFilter: (
    _req,
    file,
    callback
  ) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const extensionAllowed =
      allowedExtensions.has(
        extension
      );

    const mimeAllowed =
      allowedMimeTypes.has(
        file.mimetype
      );

    console.log(
      "Archivo TA recibido:",
      file.originalname
    );

    console.log(
      "MIME TA:",
      file.mimetype
    );

    console.log(
      "Extensión TA:",
      extension
    );

    if (
      extensionAllowed &&
      mimeAllowed
    ) {
      callback(
        null,
        true
      );

      return;
    }

    callback(
      new Error(
        "TIPO_ARCHIVO_NO_PERMITIDO"
      )
    );
  },
});
