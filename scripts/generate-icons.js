/**
 * Generate placeholder icon files for TaskForge.
 * Creates valid PNG files using raw buffer construction (no external deps).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, r, g, b) {
  // Create a minimal valid PNG file
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT chunk - raw pixel data
  const rawData = Buffer.alloc(height * (1 + width * 3)); // filter byte + RGB per pixel
  for (let y = 0; y < height; y++) {
    const offset = y * (1 + width * 3);
    rawData[offset] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 3;
      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
    }
  }
  const compressed = zlib.deflateSync(rawData);
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createICO(pngBuffer) {
  // Minimal ICO file wrapping the PNG
  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0); // reserved
  iconDir.writeUInt16LE(1, 2); // type: icon
  iconDir.writeUInt16LE(1, 4); // count: 1

  const iconEntry = Buffer.alloc(16);
  iconEntry[0] = 0; // width (0 = 256)
  iconEntry[1] = 0; // height (0 = 256)
  iconEntry[2] = 0; // palette
  iconEntry[3] = 0; // reserved
  iconEntry.writeUInt16LE(1, 4); // planes
  iconEntry.writeUInt16LE(32, 6); // bits per pixel
  iconEntry.writeUInt32LE(pngBuffer.length, 8); // size
  iconEntry.writeUInt32LE(22, 12); // offset (6 + 16 = 22)

  return Buffer.concat([iconDir, iconEntry, pngBuffer]);
}

// Generate icons
const resourcesDir = path.join(__dirname, '..', 'resources');

// 512x512 indigo icon
const icon512 = createPNG(512, 512, 99, 102, 241); // #6366f1 indigo
fs.writeFileSync(path.join(resourcesDir, 'icon.png'), icon512);
console.log('Created resources/icon.png (512x512)');

// 16x16 tray icon
const trayIcon = createPNG(16, 16, 99, 102, 241);
fs.writeFileSync(path.join(resourcesDir, 'tray-icon.png'), trayIcon);
console.log('Created resources/tray-icon.png (16x16)');

// ICO file from a 48x48 PNG (standard Windows icon size)
const icon48 = createPNG(48, 48, 99, 102, 241);
const ico = createICO(icon48);
fs.writeFileSync(path.join(resourcesDir, 'icon.ico'), ico);
console.log('Created resources/icon.ico');

console.log('All icons generated successfully!');
