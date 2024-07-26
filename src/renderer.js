const dropZone = document.getElementById('drop-zone');
const fileList = document.getElementById('file-list');
const resizeButton = document.getElementById('resize-button');
const progressBar = document.getElementById('progress-bar');
const deviceSelect = document.getElementById('device-select');
let droppedFiles = [];

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  const files = Array.from(e.dataTransfer.files);
  const pdfFiles = files.filter(file => file.type === 'application/pdf');
  
  droppedFiles = [...droppedFiles, ...pdfFiles];
  updateFileList();
});

function updateFileList() {
  fileList.innerHTML = '';
  droppedFiles.forEach(file => {
    const fileItem = document.createElement('div');
    fileItem.textContent = file.name;
    fileList.appendChild(fileItem);
  });
  
  resizeButton.disabled = droppedFiles.length === 0;
}

window.electronAPI.onResetApplication(() => {
  resetApplication();
});

function resetApplication() {
  droppedFiles = [];
  updateFileList();
  deviceSelect.selectedIndex = 0;
  dropZone.innerHTML = 'Drag and drop your PDFs here to resize them for Kindle or Remarkable.';
  progressBar.style.width = '0%';
  resizeButton.style.display = 'block';
  progressBar.style.display = 'none';
}

resizeButton.addEventListener('click', async () => {
  const device = deviceSelect.value;
  
  try {
    resizeButton.disabled = true;
    resizeButton.style.display = 'none';
    progressBar.style.display = 'block';

    for (const file of droppedFiles) {
      const baseOutputPath = file.path.replace('.pdf', `_${device}.pdf`);
      await window.electronAPI.getUniqueFilePath(baseOutputPath);
    }

    const result = await window.electronAPI.resizePDFs(droppedFiles.map(f => f.path), device);
    
    if (result.success) {
      alert('PDFs resized successfully!');
    } else {
      console.error('Failed to resize PDFs:', result.error);
      alert('Failed to resize PDFs. Please check the console for more information.');
    }
  } catch (error) {
    console.error('Error in resize process:', error);
    alert('An error occurred while resizing PDFs. Please check the console for more information.');
  } finally {
    resizeButton.disabled = false;
    resizeButton.style.display = 'block';
    progressBar.style.display = 'none';
    progressBar.style.width = '0%';
  }
});

window.electronAPI.onProgressUpdate((progress) => {
  progressBar.style.width = `${progress}%`;
});