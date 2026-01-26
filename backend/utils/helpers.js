const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const sanitizeInput = (text) => {
    return text.replace(/[^\w\s?]/gi, ''); // basic sanitization
};

module.exports = { formatDate, sanitizeInput };