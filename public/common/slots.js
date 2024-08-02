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

//handle reserve
reserveButton.addEventListener('click', function() {
    const date = document.getElementById('date').value;
    const dropdown = document.getElementById('dropdown').value;
    const selectedSeats = Array.from(document.querySelectorAll('.seat-selected')).map(seat => seat.getAttribute('id'));

    if (date && dropdown && selectedSeats.length > 0) {
        const reservation = {
            date,
            timeslot: dropdown,
            seats: selectedSeats
        };
        reservations.push(reservation);
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
    const timeslot = document.getElementById('dropdown').value;
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
            const response = await fetch('/reserve', {
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

        $.get(`/reservations/${labId}/${selectedDate}/${selectedTime}`, 
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
                            reserverName: `${reservation.reserver.firstName} ${reservation.reserver.lastName}`,
                            reserverId: `${reservation.reserver._id}`
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
                            showReserverDropdown(seatElement, reservedSeat.reserverName, reservedSeat.reserverId);
                        });
                    } else {
                        console.warn(`Seat element with ID ${reservedSeat.seatId} not found`);
                    }
                });
            }
        )
    }

    function showReserverDropdown(seatElement, reserverName, id) {
        // Create dropdown element
        const dropdown = document.createElement('div');
        dropdown.className = 'reserver-dropdown';
        
        const link = document.createElement('a');
        link.className = 'reserver-link';
        link.href = `/view_profile/${id}`;
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

