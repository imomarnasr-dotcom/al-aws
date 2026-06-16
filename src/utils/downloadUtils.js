import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Utility to download files (Base64 or Data URLs) safely on Web and Mobile.
 * @param {string} data Base64 string OR Data URL (e.g. data:image/png;base64,...) 
 * @param {string} filename The name of the file
 * @param {string} mimeType The MIME type of the file
 */
export const safeMobileDownload = async (data, filename, mimeType = '') => {
  try {
    // If it's a Capacitor native app (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      // Clean base64 if it's a data url
      let base64Data = data;
      if (data.includes('base64,')) {
        base64Data = data.split('base64,')[1];
      }

      // Write file to Cache directory
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Share the file so user can save it to downloads or open it
      await Share.share({
        title: filename,
        text: 'تم تحميل الملف بنجاح',
        url: result.uri,
        dialogTitle: 'حفظ الملف',
      });
      return true;
    } else {
      // Fallback for Web/Browser
      let url = data;
      // If data is raw base64 and not a data URL, construct data URL
      if (!data.includes('base64,')) {
        url = `data:${mimeType};base64,${data}`;
      }

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    // Fallback: try window.open if it fails
    if (!Capacitor.isNativePlatform()) {
       window.open(data, '_blank');
    }
    return false;
  }
};
