const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
app.use(cors());
app.use(bodyParser.json());

let data = require('./data.json');
let publishersMap = {};
let domainsMap = {};
data.forEach(p => {
    publishersMap[p.publisher] = 1;
    p.domains.forEach(d => {
        domainsMap[d.domain] = p.publisher;
    });
});

// Get all the data
app.get('/api/data', (req, res) => {
    res.json(data);
});

// Create a new publisher
app.post('/api/addPublisher', (req, res) => {
    try {
        const { publisher, domains } = req.body;
        if (publishersMap.hasOwnProperty(publisher)) {
            return res.status(409).json({ message: 'Publisher allready exists' });
        }
        // Add a publisher to data
        data.push({ publisher, domains });
        publishersMap[publisher] = 1;
        res.status(201).json({ message: 'Publisher added successfully' });
    } catch {
        res.status(404).json({ message: 'Publisher is not added' });
    }
});

// Create a new domain
app.post('/api/addDomain', (req, res) => {
    try {
        const { domain, desktopAds, mobileAds, publisherName } = req.body;
        if (domainsMap.hasOwnProperty(domain)) {
            return res.status(409).json({
                message: 'Domain already exists',
                publisher: domainsMap[domain] // Pass the associated publisher
            });
        }
        const publisher = data.find(p => p.publisher === publisherName);
        if (!publisher) {
            return res.status(404).json({ message: 'Publisher not found' });
        }
        // Add the domain to its publisher
        publisher.domains.push({ domain, desktopAds, mobileAds });
        domainsMap[domain] = publisherName;
        res.status(201).json({ message: 'Domain added successfully' });
    } catch {
        res.status(500).json({ message: 'An unexpected error occurred' });
    }
});

// Update an existing domain
app.put('/api/updateDomain', (req, res) => {
    try {
        const { originalDomain, inputDomain } = req.body;
        const originalName = originalDomain.domain;
        const inputName = inputDomain.domain;
        // Domain allready exists
        if (originalName !== inputName && domainsMap.hasOwnProperty(inputName)) {
            return res.status(409).json({
                message: 'Domain already exists',
                publisher: domainsMap[inputName] // Pass the associated publisher
            });
        }
        // There was no edit- then cancel
        else if (originalName == inputName && originalDomain.desktopAds == inputDomain.desktopAds &&
            originalDomain.mobileAds == inputDomain.mobileAds) {
            return res.status(400).json({ message: 'There was no edit' });
        }
        const publisher = data.find(p => p.publisher === domainsMap[originalName]);
        if (!publisher) {
            return res.status(404).json({ message: 'Publisher not found' });
        }
        const domainToUpdate = publisher.domains.find(d => d.domain === originalName);
        if (!domainToUpdate) {
            return res.status(404).json({ message: 'Domain not found' });
        }
        // Updata the data
        domainToUpdate.domain = inputName;
        domainToUpdate.desktopAds = inputDomain.desktopAds;
        domainToUpdate.mobileAds = inputDomain.mobileAds;
        // If the domain name has changed, update the map
        if (originalName !== inputName) {
            delete domainsMap[originalName];
            domainsMap[inputName] = publisher.publisher;
        }
        res.status(201).json({ message: 'Domain updated successfully' });
    } catch {
        res.status(500).json({ message: 'An unexpected error occurred' });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
