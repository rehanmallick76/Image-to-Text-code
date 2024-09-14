function previewFile() {
    const fileInput = document.getElementById('fileInput');
    const imagePreview = document.getElementById('imagePreview');
    const file = fileInput.files[0];
    const fileType = file ? file.type : '';

    if (!file) {
        alert('Please select a file.');
        return;
    }

    if (fileType.startsWith('image/')) {
        const reader = new FileReader();

        reader.onload = function(event) {
            const image = event.target.result;
            imagePreview.src = image;
            imagePreview.style.display = 'block';
        };

        reader.readAsDataURL(file);
    } else {
        alert('Selected file is not an image.');
    }
}

async function scan() {
    const fileInput = document.getElementById('fileInput');
    const pdfOptions = document.getElementById('pdfOptions');
    const pagesInput = document.getElementById('pages');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file first.');
        return;
    }

    const fileType = file.type;
    const reader = new FileReader();

    if (fileType.startsWith('image/')) {
        reader.onload = function(event) {
            const image = event.target.result;
            Tesseract.recognize(
                image,
                'eng',
                { logger: info => console.log(info) } // Optional logging
            ).then(({ data: { text } }) => {
                localStorage.setItem('scanResult', text);
                window.location.href = 'result.html'; // Redirect to result page
            }).catch(error => {
                console.error('Error recognizing text from image:', error);
                alert('Error recognizing text from image.');
            });
        };
        reader.readAsDataURL(file);

    } else if (fileType === 'application/pdf') {
        pdfOptions.style.display = 'block';

        reader.onload = async function(event) {
            try {
                const pdfData = new Uint8Array(event.target.result);
                const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
                const numPages = pdfDoc.numPages;
                const pages = pagesInput.value.trim().toLowerCase();
                const selectedPages = pages === 'all' ? Array.from({ length: numPages }, (_, i) => i + 1) : pages.split(',').map(Number);
                const textPromises = [];

                for (const pageNumber of selectedPages) {
                    if (pageNumber < 1 || pageNumber > numPages) continue;
                    const page = await pdfDoc.getPage(pageNumber);
                    textPromises.push(page.getTextContent().then(textContent => {
                        return textContent.items.map(item => item.str).join(' ');
                    }));
                }

                const texts = await Promise.all(textPromises);
                const resultText = texts.join('\n\n');
                localStorage.setItem('scanResult', resultText);
                window.location.href = 'result.html'; // Redirect to result page
            } catch (error) {
                console.error('Error recognizing text from PDF:', error);
                alert('Error recognizing text from PDF.');
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('Unsupported file type.');
    }
}

function goHome() {
    window.location.href = '/'; // Change '/' to your home page URL
}
