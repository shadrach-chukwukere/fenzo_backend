import fs from "fs";

export const saveBase64File = async (base64, filePath) => {
  try {
    const base64Data = base64.replace(/^data:.*;base64,/, "");
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
    return true;
  } catch (err) {
    return err || false;
  }
};

export const saveBlobFile = async (blob, filePath) => {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
    return true;
  } catch (err) {
    return err || false;
  }
};
