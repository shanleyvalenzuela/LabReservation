const seats = document.querySelectorAll('.seat');
const reservationsDiv = document.getElementById('reservationsDropdown');
const reserveButton = document.getElementById('reserveButton');
const makeResButton = document.getElementById('makeResButton');

let reservations = [];

seats.forEach(seat => {
    seat.addEventListener('click', function() {
        this.classList.toggle('seat-selected');
    });
});
let timeslot = "";
var timeslots = [
    {"index":1, "timeslot":"7:30-8:00"},
    {"index":2, "timeslot":"8:00-8:30"},
    {"index":3, "timeslot":"8:30-9:00"},
    {"index":4, "timeslot":"9:00-9:30"},
    {"index":5, "timeslot":"9:30-10:00"},
    {"index":6, "timeslot":"10:00-10:30"},
    {"index":7, "timeslot":"10:30-11:00"},
    {"index":8, "timeslot":"11:00-11:30"},
    {"index":9, "timeslot":"11:30-12:00"},
    {"index":10, "timeslot":"12:00-12:30"},
    {"index":11, "timeslot":"12:30-1:00"},
    {"index":12, "timeslot":"13:00-13:30"},
    {"index":13, "timeslot":"13:30-14:00"},
    {"index":14, "timeslot":"14:00-14:30"},
    {"index":15, "timeslot":"14:30-15:00"},
    {"index":16, "timeslot":"15:00-15:30"},
    {"index":17, "timeslot":"15:30-16:00"},
    {"index":18, "timeslot":"16:00-16:30"},
    {"index":19, "timeslot":"16:30-17:00"},
    {"index":20, "timeslot":"17:00-17:30"},
    {"index":21, "timeslot":"17:30-18:00"},
    {"index":22, "timeslot":"18:00-18:30"},
    {"index":23, "timeslot":"18:30-19:00"},
    {"index":24, "timeslot":"19:00-19:30"},
    {"index":25, "timeslot":"19:30-20:00"}
]

function parseTime(timeString) {
    const [time, modifier] = timeString.split(' ');
    let [hours, minutes, seconds] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) {
        hours += 12;
    }
    if (modifier === 'AM' && hours === 12) {
        hours = 0;
    }
    return { hours, minutes, seconds };
}

function findTimeslot(time) {
    const { hours, minutes } = parseTime(time);
    const timeInMinutes = hours * 60 + minutes;

    for (const slot of timeslots) {
        const [start, end] = slot.timeslot.split('-').map(parseTime);
        const startInMinutes = start.hours * 60 + start.minutes;
        const endInMinutes = end.hours * 60 + end.minutes;

        if (timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes) {
            return slot.timeslot;
        }
    }
    return null; // or some default value if no timeslot is found
}
//handle reserve
reserveButton.addEventListener('click', function() {
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const selectedSeats = Array.from(document.querySelectorAll('.seat-selected')).map(seat => seat.getAttribute('id'));

    if (date && time && selectedSeats.length > 0) {
        timeslot = findTimeslot(time);
        console.log("timeslot: " + timeslot);
        const reservation = {
            date,
            timeslot: timeslot,
            seats: selectedSeats
        };
        reservations.push(reservation);
        console.log(reservations);
        displayReservations();
    } else {
        alert('Please select a date, time, and at least one seat.');
    }
});

        
function displayReservations() {
    reservationsDiv.innerHTML = '';
    reservations.forEach((reservation, index) => {
        const reservationDiv = document.createElement('div');
        reservationDiv.classList.add('reservation');
        reservationDiv.innerHTML = `
            <b>ID: ${index + 1}</b><br>
            Date: ${reservation.date} &nbsp&nbsp Timeslot: ${reservation.timeslot}<br>
            Seat/s: ${reservation.seats.join(', ')}<br>
            <button class="delete-button" data-index="${index}">Delete</button>
        `;
        reservationsDiv.appendChild(reservationDiv);
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            deleteReservation(index);
        });
    });
}

//handle delete reservation
function deleteReservation(index) {
    reservations.splice(index, 1);
    displayReservations();
}

//handle make reservation
makeResButton.addEventListener('click', async function() {
    const lab_id = document.getElementById('lab_id').value;
    const lab_name = document.getElementById('lab_name').value;
    const lab_loc = document.getElementById('lab_loc').value;
    const date = document.getElementById('date').value; 
    const selectedSeats = Array.from(document.querySelectorAll('.seat-selected')).map(seat => seat.getAttribute('id'));

    if (date && timeslot && selectedSeats.length > 0) {
        const reservation = {
            date,
            timeslot,
            seats: selectedSeats
        };

        const data = {
            lab_id,
            lab_name,
            lab_loc,
            reservations: reservations
        };

        try {
            const response = await fetch('/tech-reserve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const html = await response.text();
                document.documentElement.innerHTML = html;
            } else {
                alert('Failed to make reservation.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to make reservation.');
        }
    } else {
        alert('Please fill in all fields.');
    }
});

$(document).ready(function() {
    var dateInput = $('#date');
    var timeSelect = $('#dropdown');
    var labId = $('#lab_id').val();
    var labName = $('#lab_name').val();
    var labLoc = $('#lab_loc').val();

    // next 7 days
    function generateDates() {
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i + 1);
            const dateString = date.toISOString().split('T')[0];
            const option = $('<option></option>').attr('value', dateString).text(dateString);
            dateInput.append(option);
        }
    }

    generateDates();
    function fetchReservations() {
        const selectedDate = dateInput.val();
        const selectedTime = timeSelect.val();

        if (!selectedDate || !selectedTime) {
            console.log('Date or time not selected.');
            return;
        }

        console.log(`Selected date: ${selectedDate}, Selected time: ${selectedTime}`);

        $.get(`/tech-reservations/${labId}/${selectedDate}/${selectedTime}`, 
            { lab_name: labName, lab_loc: labLoc },
            function(response) {
                console.log('Response received:', response);

                // Check if response is defined and an array
                if (!response || !Array.isArray(response)) {
                    console.error('Invalid response format:', response);
                    alert('Invalid response from the server. Please try again later.');
                    return;
                }

                const reservedSeats = response.map(reservation => {
                    // Check if reservation has seats and reserver properties
                    if (!reservation.seats || !reservation.reserver) {
                        console.error('Invalid reservation format:', reservation);
                        return [];
                    }

                    return reservation.seats.map(seatId => {
                        return {
                            seatId: seatId,
                            reserverName: `${reservation.reserver.firstName} ${reservation.reserver.lastName}`
                        };
                    });
                }).flat();

                console.log('Processed Reserved Seats:', reservedSeats);

                const seats = document.querySelectorAll('.seat, .seat-reserved');
                seats.forEach(function(seat) {
                    seat.classList.remove('seat-reserved');
                    seat.classList.add('seat');
                });

                reservedSeats.forEach(function(reservedSeat) {
                    console.log(`Updating seat ${reservedSeat.seatId}`);
                    const seatElement = document.getElementById(reservedSeat.seatId);
                    if (seatElement) {
                        seatElement.classList.remove('seat');
                        seatElement.classList.add('seat-reserved');
                        seatElement.title = reservedSeat.reserverName; // Optionally set a tooltip with reserver name
                        seatElement.addEventListener('click', function() {
                            showReserverDropdown(seatElement, reservedSeat.reserverName);
                        });
                    } else {
                        console.warn(`Seat element with ID ${reservedSeat.seatId} not found`);
                    }
                });
            }
        )
    }

    function showReserverDropdown(seatElement, reserverName) {
        // Create dropdown element
        const dropdown = document.createElement('div');
        dropdown.className = 'reserver-dropdown';
        
        const link = document.createElement('a');
        link.className = 'reserver-link';
        link.href = '#'; // dynamic link to user profile
        link.textContent = reserverName;

        dropdown.appendChild(link);
        // Position dropdown
        const rect = seatElement.getBoundingClientRect();
        dropdown.style.position = 'absolute';
        dropdown.style.top = `${rect.bottom}px`;
        dropdown.style.left = `${rect.left}px`;

        // Append dropdown to body
        document.body.appendChild(dropdown);

        // Remove dropdown when clicking outside
        function removeDropdown() {
            dropdown.remove();
            document.removeEventListener('click', removeDropdown);
        }

        setTimeout(() => {
            document.addEventListener('click', removeDropdown);
        }, 0);
    }

    dateInput.on('change', fetchReservations);
    timeSelect.on('change', fetchReservations);

    // Initially fetch reservations if both date and time are already set
    if (dateInput.val() && timeSelect.val()) {
        fetchReservations();
    }
});

