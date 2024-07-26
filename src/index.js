const { app, BrowserWindow, ipcMain, nativeImage } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');

app.name = "Resizaar";

function getIconPath() {
  const iconName = process.platform === 'darwin' ? 'icon.icns' : 
                   process.platform === 'win32' ? 'icon.ico' : 
                   'icon.png';
  return path.join(__dirname, 'assets', iconName);
}

function createWindow() {
  const iconPath = getIconPath();
  
  const windowOptions = {
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  };

  if (iconPath && fs.existsSync(iconPath)) {
    windowOptions.icon = nativeImage.createFromPath(iconPath);
  }

  const win = new BrowserWindow(windowOptions);

  win.loadFile(path.join(__dirname, 'index.html'));
  win.setTitle("Resizaar");
}

function getK2pdfoptPath() {
  const platform = os.platform();
  const arch = os.arch();
  let executableName;

  if (platform === 'darwin') {
    executableName = arch === 'arm64' ? 'k2pdfopt_mac_ARM' : 'k2pdfopt_mac_x86';
  } else if (platform === 'win32') {
    executableName = 'k2pdfopt_win_32.exe';
  } else if (platform === 'linux') {
    if (arch === 'x64') {
      executableName = 'k2pdfopt_lnx_64';
    } else if (arch === 'ia32') {
      executableName = 'k2pdfopt_lnx_32';
    } else {
      throw new Error('Unsupported Linux architecture');
    }
  } else {
    throw new Error('Unsupported operating system');
  }

  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'bin', executableName);
  } else {
    return path.join(__dirname, 'bin', executableName);
  }
}

function getUniqueFilePath(filePath) {
  let newPath = filePath;
  let counter = 1;
  while (fs.existsSync(newPath)) {
    const { dir, name, ext } = path.parse(filePath);
    newPath = path.join(dir, `${name}_${counter}${ext}`);
    counter++;
  }
  return newPath;
}

function resizePDF(filePath, device) {
  return new Promise((resolve, reject) => {
    const baseOutputPath = filePath.replace('.pdf', `_${device}.pdf`);
    const outputPath = getUniqueFilePath(baseOutputPath);
    const k2pdfoptPath = getK2pdfoptPath();
    
    let deviceParams;
    if (device === 'kindle') {
      deviceParams = {
        width: 1072,
        height: 1448,
        dpi: 300,
        fontSize: 8,
        magnification: 1.0
      };
    } else if (device === 'remarkable') {
      deviceParams = {
        width: 1404,
        height: 1872,
        dpi: 300,
        fontSize: 8,
        magnification: 1.0
      };
    } else {
      reject(new Error('Unsupported device'));
      return;
    }

    const command = `'${k2pdfoptPath}' -w ${deviceParams.width} -h ${deviceParams.height} -dpi ${deviceParams.dpi} -fs ${deviceParams.fontSize} -mag ${deviceParams.magnification} -vb 1 -mode def -j 0 -om 0.05,0.05,0.05,0.05 -ui- -fc- -wrap -y -o '${outputPath}' '${filePath}'`;
    
    const childProcess = exec(command);

    let conversionFinished = false;
    let totalPages = 0;
    let currentPage = 0;

    childProcess.stdout.on('data', (data) => {
      const message = data.toString();
      
      if (message.includes('Total CPU time used:')) {
        conversionFinished = true;
      }

      const pageMatch = message.match(/SOURCE PAGE (\d+) of (\d+)/);
      if (pageMatch) {
        currentPage = parseInt(pageMatch[1], 10);
        totalPages = parseInt(pageMatch[2], 10);
        const progress = Math.round((currentPage / totalPages) * 100);
        BrowserWindow.getAllWindows()[0].webContents.send('progress-update', progress);
      }
    });

    childProcess.stderr.on('data', (data) => {
      const message = data.toString();
      if (!message.toLowerCase().includes('warning')) {
        console.error(`k2pdfopt error: ${message.trim()}`);
      }
    });

    childProcess.on('error', (error) => {
      console.error(`Failed to start k2pdfopt process: ${error.message}`);
      reject(error);
    });

    const checkInterval = setInterval(() => {
      if (conversionFinished) {
        clearInterval(checkInterval);
        childProcess.kill();
        resolve(outputPath);
      }
    }, 1000);

    setTimeout(() => {
      if (!conversionFinished) {
        clearInterval(checkInterval);
        childProcess.kill();
        console.error('k2pdfopt process timed out after 5 minutes');
        reject(new Error('PDF conversion timed out'));
      }
    }, 5 * 60 * 1000);
  });
}

app.whenReady().then(() => {
  createWindow();
  
  if (process.platform === 'darwin') {
    const iconPath = getIconPath();
    if (iconPath && fs.existsSync(iconPath)) {
      const image = nativeImage.createFromPath(iconPath);
      app.dock.setIcon(image);
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('get-unique-file-path', (event, filePath) => {
  return getUniqueFilePath(filePath);
});

ipcMain.handle('resize-pdfs', async (event, filePaths, device) => {
  try {
    for (const filePath of filePaths) {
      await resizePDF(filePath, device);
    }
    event.sender.send('reset-application');
    return { success: true };
  } catch (error) {
    console.error('Error resizing PDFs:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('trigger-reset', (event) => {
  event.sender.send('reset-application');
});

ipcMain.on('progress-update', (event, progress) => {
  BrowserWindow.getAllWindows()[0].webContents.send('progress-update', progress);
});