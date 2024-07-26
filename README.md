# Resizaar

## 1. Overview

Resizaar is a user-friendly desktop application for resizing PDFs, optimized for e-readers like Kindle and reMarkable. It provides a simple drag-and-drop interface for a task that traditionally required command-line expertise.

### Shout-outs

- **k2pdfopt**: The core PDF resizing functionality is powered by k2pdfopt, an exceptional command-line tool created by Willus Hines. Visit [k2pdfopt's official website](https://www.willus.com/k2pdfopt/) to learn more about this powerful tool.

- **Electron**: Resizaar is built using Electron, enabling us to create a cross-platform desktop application using web technologies. Learn more about Electron at [electronjs.org](https://www.electronjs.org/).

## 2. Building and Installing

### Prerequisites

- Node.js (v14.0.0 or later)
- npm (comes with Node.js)
- Git

### Build Steps

1. Clone the repository:
_git clone https://github.com/2oby/Resizaar.git
cd Resizaar_

2. Install dependencies:
_npm install_

3. Build the application:
_npm run build_

This creates distributable packages in the `dist` folder.

### Installation

- **macOS**: Open the `.dmg` file in the `dist` folder and drag Resizaar to your Applications folder.
- **Windows**: Run the `.exe` installer from the `dist` folder.
- **Linux**: Make the `.AppImage` file in the `dist` folder executable and run it.

## 3. How to Use

1. Launch Resizaar
2. Drag and drop PDF files onto the application window
3. Select your target device (Kindle or reMarkable)
4. Click "Resize PDFs"
5. Resized PDFs will be saved in the same folder as the originals, with "_kindle" or "_remarkable" appended to the filename

## 4. License

Resizaar is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

k2pdfopt is licensed under the Affero GPL License. For more details, visit [k2pdfopt's license page](https://www.willus.com/k2pdfopt/license.shtml).

## 5. Technical Details

Resizaar is built with Electron, utilizing a main process (`index.js`) and a renderer process (`renderer.js`). It uses IPC (Inter-Process Communication) to handle the PDF resizing operations.

Key components:
- `index.js`: Sets up the Electron window and manages k2pdfopt execution
- `renderer.js`: Handles UI interactions and communicates with the main process
- `preload.js`: Provides a secure bridge between renderer and main processes
- `index.html` & `styles.css`: Define the application's UI

The application uses child processes to execute k2pdfopt commands, with progress updates sent back to the UI via IPC.

## 6. Contributions

Feel free to clone this repository and extend Resizaar's functionality. While I won't have time to actively maintain this project, I appreciate any contributions or improvements you might make.

If you find Resizaar useful, you can show your appreciation by checking out my science fiction books at [www.tobyweston.net](http://www.tobyweston.net).

Happy PDF resizing!
