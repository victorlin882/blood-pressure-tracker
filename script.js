// Blood Pressure & Pulse Tracker JavaScript

// API Configuration - Use current host for mobile access
const API_URL = `${window.location.origin}/api`;

class BloodPressureTracker {
    constructor() {
        this.readings = [];
        this.initializeEventListeners();
        this.setDefaultFilterDates();
        this.loadReadings();
        // Focus on upper pressure field when page loads
        this.focusUpperPressure();
    }

    // Focus on the upper pressure input field
    focusUpperPressure() {
        // Use setTimeout to ensure field is ready (especially after form reset)
        setTimeout(() => {
            const upperPressureField = document.getElementById('upperPressure');
            if (upperPressureField) {
                upperPressureField.focus();
            }
        }, 10);
    }

    // Set default filter dates (today and 2 weeks before)
    setDefaultFilterDates() {
        const today = new Date();
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(today.getDate() - 14);

        // Format dates as YYYY-MM-DD for input fields
        const formatDateForInput = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        document.getElementById('fromDate').value = formatDateForInput(twoWeeksAgo);
        document.getElementById('toDate').value = formatDateForInput(today);
    }

    // Load readings from MySQL database via API
    async loadReadings(fromDate = null, toDate = null) {
        try {
            let url = `${API_URL}/readings`;
            if (fromDate && toDate) {
                url += `?fromDate=${fromDate}&toDate=${toDate}`;
            }
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch readings');
            }
            this.readings = await response.json();
            this.displayHistory();
        } catch (error) {
            console.error('Error loading readings:', error);
            this.showNotification('Failed to load readings from database', 'error');
            this.readings = [];
            this.displayHistory();
        }
    }

    // Save reading to MySQL database via API
    async saveReading(reading) {
        try {
            const response = await fetch(`${API_URL}/readings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reading)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save reading');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error saving reading:', error);
            throw error;
        }
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Form submission
        document.getElementById('bpForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addReading();
        });

        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearForm();
        });

        // Edit form submission
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateReading();
        });

        // Modal close events
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('editModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Filter button
        document.getElementById('filterBtn').addEventListener('click', () => {
            this.applyFilter();
        });

        // Clear filter button
        document.getElementById('clearFilterBtn').addEventListener('click', () => {
            this.clearFilter();
        });

        // Print button
        document.getElementById('printBtn').addEventListener('click', () => {
            this.printRecords();
        });
    }

    // Get Hong Kong date and time
    getHongKongDateTime() {
        const now = new Date();
        
        // Convert to Hong Kong timezone (Asia/Hong_Kong, UTC+8)
        const hkDateString = now.toLocaleString('en-CA', { 
            timeZone: 'Asia/Hong_Kong',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        // Format: "YYYY-MM-DD, HH:MM:SS"
        const [datePart, timePart] = hkDateString.split(', ');
        const inputDate = datePart; // Already in YYYY-MM-DD format
        const inputTime = timePart; // Already in HH:MM:SS format
        
        return { inputDate, inputTime };
    }

    // Add a new reading
    async addReading() {
        const upperPressure = parseInt(document.getElementById('upperPressure').value);
        const lowerPressure = parseInt(document.getElementById('lowerPressure').value);
        const pulseRate = parseInt(document.getElementById('pulseRate').value);

        // Validate input
        if (!this.validateInput(upperPressure, lowerPressure, pulseRate)) {
            return;
        }

        // Get Hong Kong date and time
        const { inputDate, inputTime } = this.getHongKongDateTime();

        const reading = {
            id: Date.now(),
            upperPressure,
            lowerPressure,
            pulseRate,
            inputDate,
            inputTime
        };

        try {
            await this.saveReading(reading);
            await this.loadReadings(); // Reload to get fresh data
            this.clearForm();
            this.showNotification('Reading added successfully!', 'success');
        } catch (error) {
            this.showNotification('Failed to add reading to database', 'error');
        }
    }

    // Validate input values
    validateInput(upper, lower, pulse) {
        if (upper < 50 || upper > 300) {
            this.showNotification('Upper pressure must be between 50-300 mmHg', 'error');
            return false;
        }
        if (lower < 30 || lower > 200) {
            this.showNotification('Lower pressure must be between 30-200 mmHg', 'error');
            return false;
        }
        if (pulse < 30 || pulse > 200) {
            this.showNotification('Pulse rate must be between 30-200 bpm', 'error');
            return false;
        }
        if (upper <= lower) {
            this.showNotification('Upper pressure must be higher than lower pressure', 'error');
            return false;
        }
        return true;
    }

    // Clear the input form
    clearForm() {
        document.getElementById('bpForm').reset();
        // Focus on upper pressure field after clearing
        this.focusUpperPressure();
    }

    // Format date as dd/mm/yy (for display in table)
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    }

    // Convert YYYY-MM-DD to dd/mm/yyyy (for edit modal)
    formatDateForEdit(dateStr) {
        if (!dateStr) {
            console.warn('formatDateForEdit: dateStr is empty/null/undefined');
            return '';
        }
        
        // Trim whitespace
        dateStr = String(dateStr).trim();
        
        // If already in dd/mm/yyyy format, return as is
        if (dateStr.includes('/') && dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            console.log('formatDateForEdit: Already in dd/mm/yyyy format', dateStr);
            return dateStr;
        }
        
        // Handle YYYY-MM-DD format (may include time part, so extract date only)
        if (dateStr.includes('-')) {
            // Extract just the date part (before space or T)
            const datePart = dateStr.split(' ')[0].split('T')[0];
            const parts = datePart.split('-');
            
            if (parts.length === 3) {
                // Validate parts are numbers
                const year = parts[0];
                const month = parts[1];
                const day = parts[2];
                
                if (year && month && day) {
                    // Pad day and month to ensure 2 digits
                    const paddedDay = day.padStart(2, '0');
                    const paddedMonth = month.padStart(2, '0');
                    const result = `${paddedDay}/${paddedMonth}/${year}`;
                    console.log('formatDateForEdit: YYYY-MM-DD format converted', dateStr, '->', result);
                    return result; // Convert YYYY-MM-DD to dd/mm/yyyy
                }
            }
        }
        
        // Try parsing as date (fallback for other formats)
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const result = `${day}/${month}/${year}`;
                console.log('formatDateForEdit: Date object formatted', dateStr, '->', result);
                return result;
            }
        } catch (e) {
            console.error('formatDateForEdit: Error parsing date', dateStr, e);
        }
        
        console.error('formatDateForEdit: Could not parse date', dateStr);
        return '';
    }

    // Convert dd/mm/yyyy to YYYY-MM-DD (for database)
    parseDateFromEdit(dateStr) {
        if (!dateStr) return '';
        // Check if already in YYYY-MM-DD format
        if (dateStr.includes('-') && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            return dateStr;
        }
        // Parse dd/mm/yyyy format
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`; // Convert to YYYY-MM-DD
        }
        return dateStr; // Return as-is if can't parse
    }

    // Format time as hh:mm
    formatTime(timeStr) {
        const parts = timeStr.split(':');
        return `${parts[0]}:${parts[1]}`;
    }

    // Get day of week
    getDayOfWeek(dateStr) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const date = new Date(dateStr);
        return days[date.getDay()];
    }

    // Display reading history
    displayHistory() {
        const historyList = document.getElementById('historyList');
        const noDataMessage = document.getElementById('noDataMessage');

        if (this.readings.length === 0) {
            historyList.innerHTML = '';
            noDataMessage.style.display = 'block';
            return;
        }

        noDataMessage.style.display = 'none';
        
        // Create table structure
        let tableHTML = `
            <div class="table-responsive">
                <table class="readings-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Day of Week</th>
                            <th>Upper Pressure</th>
                            <th>Lower Pressure</th>
                            <th>Blood Pressure</th>
                            <th>Pulse Rate</th>
                            <th>Pulse Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.readings.forEach(reading => {
            const bpCategory = this.getBloodPressureCategory(reading.upperPressure, reading.lowerPressure);
            const pulseCategory = this.getPulseCategory(reading.pulseRate);
            
            // Format date and time
            const formattedDate = this.formatDate(reading.inputDate);
            const formattedTime = this.formatTime(reading.inputTime);
            const dayOfWeek = this.getDayOfWeek(reading.inputDate);
            
            tableHTML += `
                <tr>
                    <td data-label="Date">${formattedDate}</td>
                    <td data-label="Time">${formattedTime}</td>
                    <td data-label="Day of Week">${dayOfWeek}</td>
                    <td data-label="Upper Pressure">${reading.upperPressure} mmHg</td>
                    <td data-label="Lower Pressure">${reading.lowerPressure} mmHg</td>
                    <td data-label="Blood Pressure">
                        <span class="status-badge ${bpCategory.class}">${bpCategory.text}</span>
                    </td>
                    <td data-label="Pulse Rate">${reading.pulseRate} bpm</td>
                    <td data-label="Pulse Status">
                        <span class="status-badge ${pulseCategory.class}">${pulseCategory.text}</span>
                    </td>
                    <td data-label="Actions" class="actions-cell">
                        <button class="btn btn-edit btn-sm" onclick="bpTracker.editReading(${reading.id})" title="Edit">✏️</button>
                        <button class="btn btn-delete btn-sm" onclick="bpTracker.deleteReading(${reading.id})" title="Delete">🗑️</button>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        historyList.innerHTML = tableHTML;
    }

    // Create a reading element for display (legacy - kept for compatibility)
    createReadingElement(reading) {
        // This method is no longer used but kept for backward compatibility
        return document.createElement('div');
    }

    // Get blood pressure category (AHA/ACC Guidelines)
    getBloodPressureCategory(upper, lower) {
        // Normal: < 120/80
        if (upper < 120 && lower < 80) {
            return { text: 'Normal', class: 'normal' };
        }
        // Elevated: 120-129/< 80
        else if (upper >= 120 && upper < 130 && lower < 80) {
            return { text: 'Elevated', class: 'elevated' };
        }
        // High Stage 1: 130-139 OR 80-89
        else if ((upper >= 130 && upper < 140) || (lower >= 80 && lower < 90)) {
            return { text: 'High Stage 1', class: 'high' };
        }
        // Crisis: >= 180 OR >= 120
        else if (upper >= 180 || lower >= 120) {
            return { text: 'Crisis', class: 'crisis' };
        }
        // High Stage 2: >= 140 OR >= 90 (but not crisis)
        else {
            return { text: 'High Stage 2', class: 'high' };
        }
    }

    // Get pulse category
    getPulseCategory(pulse) {
        if (pulse < 60) {
            return { text: 'Low', class: 'low' };
        } else if (pulse <= 100) {
            return { text: 'Normal', class: 'normal' };
        } else {
            return { text: 'High', class: 'high' };
        }
    }

    // Edit a reading
    editReading(id) {
        const reading = this.readings.find(r => r.id === id);
        if (!reading) {
            console.error('editReading: Reading not found for id', id);
            return;
        }

        console.log('editReading: Full reading object', reading);
        console.log('editReading: reading.inputDate', reading.inputDate, 'type:', typeof reading.inputDate);

        document.getElementById('editId').value = reading.id;
        
        // Format date for edit input (dd/mm/yyyy)
        const dateValue = this.formatDateForEdit(reading.inputDate);
        console.log('editReading: Formatted dateValue', dateValue);
        
        if (!dateValue) {
            console.error('editReading: dateValue is empty after formatting');
        }
        
        document.getElementById('editInputDate').value = dateValue || '';
        
        // Format time from HH:MM:SS to HH:MM for time input
        let timeValue = reading.inputTime;
        if (typeof timeValue === 'string') {
            timeValue = timeValue.split(':').slice(0, 2).join(':');
        } else if (timeValue instanceof Date) {
            const hours = String(timeValue.getHours()).padStart(2, '0');
            const minutes = String(timeValue.getMinutes()).padStart(2, '0');
            timeValue = `${hours}:${minutes}`;
        }
        document.getElementById('editInputTime').value = timeValue;
        
        document.getElementById('editUpperPressure').value = reading.upperPressure;
        document.getElementById('editLowerPressure').value = reading.lowerPressure;
        document.getElementById('editPulseRate').value = reading.pulseRate;

        // Show modal and prevent body scrolling
        const modal = document.getElementById('editModal');
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
        
        // Reset all scroll positions
        const modalContent = document.querySelector('.modal-content');
        const formElement = document.getElementById('editForm');
        
        if (modalContent) {
            modalContent.scrollTop = 0;
        }
        
        if (formElement) {
            formElement.scrollTop = 0;
        }
        
        // Scroll modal container to show the modal (in case it's off screen)
        setTimeout(() => {
            modal.scrollTop = 0;
            // Force a reflow to ensure layout is complete
            void modal.offsetHeight;
        }, 50);
    }

    // Update a reading
    async updateReading() {
        const id = parseInt(document.getElementById('editId').value);
        const inputDateStr = document.getElementById('editInputDate').value;
        const inputTime = document.getElementById('editInputTime').value;
        const upperPressure = parseInt(document.getElementById('editUpperPressure').value);
        const lowerPressure = parseInt(document.getElementById('editLowerPressure').value);
        const pulseRate = parseInt(document.getElementById('editPulseRate').value);

        if (!this.validateInput(upperPressure, lowerPressure, pulseRate)) {
            return;
        }

        // Convert dd/mm/yyyy to YYYY-MM-DD for database
        const inputDate = this.parseDateFromEdit(inputDateStr);
        
        // Validate date format
        if (!inputDate || !inputDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            this.showNotification('Please enter date in dd/mm/yyyy format (e.g., 29/10/2025)', 'error');
            return;
        }

        // Format time to include seconds (HH:MM -> HH:MM:SS)
        const timeWithSeconds = inputTime + ':00';

        try {
            const response = await fetch(`${API_URL}/readings/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputDate,
                    inputTime: timeWithSeconds,
                    upperPressure,
                    lowerPressure,
                    pulseRate
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update reading');
            }

            await this.loadReadings(); // Reload to get fresh data
            this.closeModal();
            this.showNotification('Reading updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating reading:', error);
            this.showNotification('Failed to update reading in database', 'error');
        }
    }

    // Delete a reading
    async deleteReading(id) {
        if (confirm('Are you sure you want to delete this reading?')) {
            try {
                const response = await fetch(`${API_URL}/readings/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Failed to delete reading');
                }

                await this.loadReadings(); // Reload to get fresh data
                this.showNotification('Reading deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting reading:', error);
                this.showNotification('Failed to delete reading from database', 'error');
            }
        }
    }

    // Apply date filter
    async applyFilter() {
        const fromDate = document.getElementById('fromDate').value;
        const toDate = document.getElementById('toDate').value;

        if (!fromDate || !toDate) {
            this.showNotification('Please select both from and to dates', 'error');
            return;
        }

        if (fromDate > toDate) {
            this.showNotification('From date must be before or equal to to date', 'error');
            return;
        }

        await this.loadReadings(fromDate, toDate);
        this.showNotification('Filter applied', 'success');
    }

    // Clear date filter
    async clearFilter() {
        document.getElementById('fromDate').value = '';
        document.getElementById('toDate').value = '';
        await this.loadReadings();
        this.showNotification('Filter cleared', 'success');
    }

    // Print records
    printRecords() {
        if (this.readings.length === 0) {
            this.showNotification('No records to print', 'error');
            return;
        }

        const printWindow = window.open('', '_blank');
        const fromDate = document.getElementById('fromDate').value;
        const toDate = document.getElementById('toDate').value;
        const dateRange = (fromDate && toDate) ? 
            `<p style="text-align: center; margin-bottom: 20px;"><strong>Date Range:</strong> ${this.formatDate(fromDate)} to ${this.formatDate(toDate)}</p>` : 
            '';

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Blood Pressure Records</title>
                <style>
                    @page {
                        size: A4 landscape;
                        margin: 15mm;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 11px;
                        line-height: 1.4;
                        color: #333;
                    }
                    h1 {
                        text-align: center;
                        color: #667eea;
                        margin-bottom: 10px;
                        font-size: 18px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px 6px;
                        text-align: center;
                    }
                    th {
                        background-color: #667eea;
                        color: white;
                        font-weight: bold;
                        font-size: 10px;
                        text-transform: uppercase;
                    }
                    tr:nth-child(even) {
                        background-color: #f8fafc;
                    }
                    .status-badge {
                        display: inline-block;
                        padding: 3px 8px;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 10px;
                    }
                    .normal { 
                        background-color: #c6f6d5;
                        color: #22543d;
                    }
                    .elevated { 
                        background-color: #fef5e7;
                        color: #744210;
                    }
                    .high { 
                        background-color: #fed7d7;
                        color: #742a2a;
                    }
                    .crisis { 
                        background-color: #feb2b2;
                        color: #742a2a;
                        font-weight: bold;
                    }
                    .low { 
                        background-color: #bee3f8;
                        color: #2a4365;
                    }
                    .print-date {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 9px;
                        color: #666;
                    }
                    @media print {
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>🩺 Blood Pressure & Pulse Records</h1>
                ${dateRange}
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Day of Week</th>
                            <th>Upper<br>Pressure<br>(mmHg)</th>
                            <th>Lower<br>Pressure<br>(mmHg)</th>
                            <th>Blood Pressure<br>Status</th>
                            <th>Pulse Rate<br>(bpm)</th>
                            <th>Pulse<br>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.readings.map(reading => {
                            const bpCategory = this.getBloodPressureCategory(reading.upperPressure, reading.lowerPressure);
                            const pulseCategory = this.getPulseCategory(reading.pulseRate);
                            const formattedDate = this.formatDate(reading.inputDate);
                            const formattedTime = this.formatTime(reading.inputTime);
                            const dayOfWeek = this.getDayOfWeek(reading.inputDate);
                            return `
                                <tr>
                                    <td>${formattedDate}</td>
                                    <td>${formattedTime}</td>
                                    <td>${dayOfWeek}</td>
                                    <td>${reading.upperPressure}</td>
                                    <td>${reading.lowerPressure}</td>
                                    <td><span class="status-badge ${bpCategory.class}">${bpCategory.text}</span></td>
                                    <td>${reading.pulseRate}</td>
                                    <td><span class="status-badge ${pulseCategory.class}">${pulseCategory.text}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                <div class="print-date">
                    <p>Printed on: ${new Date().toLocaleString()}</p>
                    <p>Total Records: ${this.readings.length}</p>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
    }

    // Close the edit modal
    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    // Show notification
    showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize the application when the page loads
let bpTracker;
document.addEventListener('DOMContentLoaded', () => {
    bpTracker = new BloodPressureTracker();
});




