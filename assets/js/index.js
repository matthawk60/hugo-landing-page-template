import EffectCarousel from './effect-carousel';
import { DateTime, IANAZone } from 'luxon';

import Modal from "js/bootstrap/src/modal";

function generateTimeslots(date) {
	let start = DateTime.fromJSDate(date, { zone: 'America/Los_Angeles' });

	// If the date has been rolled back to the previous day, add 24 hours
	if (start.toISOTime() == '21:00:00.000-08:00') {
		start = start.plus({ days: 1 });
	}

	console.log('Time after correction:', start.toISO());

	let timeslots = [9, 11, 13, 15, 17].map((hour, idx) => {
		start = start.set({ hour: hour, minute: 0, second: 0 });
		let end = start.set({
			hour: hour + 2,
			minute: 0,
			second: 0,
		});
		let slot = { start, end };
		return slot;
	});
	timeslots = timeslots.filter((slot) => slot.end > DateTime.now());
	return timeslots;
}

window.onload = function (e) {
	// eslint-disable-next-line
	const swiper = new Swiper('.swiper', {
		// pass EffectCarousel module to modules
		modules: [EffectCarousel],
		// specify "carousel" effect
		effect: 'carousel',
		// carousel effect parameters

		grabCursor: true,
		loop: true,
		loopAdditionalSlides: 1,
		slidesPerView: 'auto',
		initialSlide: 5,
	});
	const swiper2 = new Swiper('.swiper-map', {
		loop: true,
		navigation: {
			nextEl: '.swiper-button-next2',
			prevEl: '.swiper-button-prev2',
		},
		pagination: {
			el: '.swiper-pagination2',
			clickable: true,
		},
	});
	const swiper5 = new Swiper('#swiper-center', {
		loop: true,
		slidesPerView: 3,
		spaceBetween: 50,
		navigation: {
			nextEl: '.swiper-button-next2',
			prevEl: '.swiper-button-prev2',
		},
		pagination: {
			el: '.swiper-pagination3',
			type: 'progressbar', //added
		},
	});
	const swiper6 = new Swiper('#center-mobile', {
		loop: true,
		slidesPerView: 1,
	});

	/***********************************************************************
	 * 	Appointment Modal and Form Reactor
	 *
	 *
	 *
	 *
	 *
	 ************************************************************************/

	//Initalize Bootstrap modal
	const appointmentModal = new Modal('#appointmentModal', {
		keyboard: false,
		backdrop: 'static',
	});

	// Get the current date and time in PST
	let minDate = DateTime.now().setZone('America/Los_Angeles');

	// Set the time to 7PM
	minDate = minDate.set({ hour: 19, minute: 0, second: 0 });

	// If the adjusted time is in the past, add 24 hours (it means we're already past 7PM PST today)
	if (minDate < DateTime.now().setZone('America/Los_Angeles')) {
		minDate = minDate.plus({ days: 1 });
	}
	// Initialize flatpickr with minDate and maxDate
	const datepicker = flatpickr('#datepicker', {
		inline: true, // make the calendar always visible
		onChange: handleDateChange,
		minDate: new Date(minDate.toJSDate()),
		maxDate: new Date().fp_incr(4), // 14 days from now
	});

	// Get the timeslots container
	const timeslotsContainer = document.getElementById('timeslots');
	const timeslotsList = document.getElementById('timeslotsList');

	// Function to handle date selection
	function handleDateChange(selectedDates, dateStr, instance) {
		// show the timeslots container
		timeslotsContainer.classList.remove('d-none');
		// Clear any existing timeslots
		timeslotsList.innerHTML = '';
		const timeslots = generateTimeslots(selectedDates[0]);

		//create a button for each timeslot

		timeslots.forEach((timeslot) => {
			const time = {
				start: timeslot.start.setZone('local').toFormat('h:mm a'),
				end: timeslot.end.setZone('local').toFormat('h:mm a'),
			};
			const button = document.createElement('button');
			button.textContent = time.start + ' - ' + time.end;
			button.classList.add('btn', 'btn-bd-outline', 'm-1', 'appointment-slot', 'fw-bold');
			button.addEventListener('click', handleTimeslotClick);
			timeslotsList.appendChild(button);
		});
	}
	//Remove timeslots when modal is closed
	appointmentModal._element.addEventListener('hidden.bs.modal', function (event) {
		timeslotsContainer.classList.add('d-none');
		timeslotsList.innerHTML = '';
		appointmentThanks.classList.add('d-none');
		appointmentModalText.classList.remove('d-none');
		appointmentForm.reset();
		datepicker.setDate('');
	});

	// Function to update the UI
	function updateUI(data) {
		const { day, month, year, timeZone, time } = data;
		const appointmentDate = document.getElementById('appointmentDate');
		const appointmentTime = document.getElementById('appointmentTime');
		const appointmentTimeZone = document.getElementById('appointmentTimeZone');
		appointmentDate.textContent = `${month}/${day}/${year}`;
		appointmentTime.textContent = time;
		appointmentTimeZone.textContent = timeZone;
	}
	let selectedAppointment = {};

	const form = document.querySelector('#appointmentForm');
	const message = document.querySelector('#message');

	const phoneInputField = document.querySelector('#inputPhone');
	const phoneInput = window.intlTelInput(phoneInputField, {
		utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js',
	});

	// Function to handle timeslot selection
	function handleTimeslotClick(event) {
		// Remove 'selected' class from all timeslot buttons
		document.querySelectorAll('.appointment-slot').forEach((button) => {
			button.classList.remove('btn-bd-schedule');
			button.classList.add('btn-bd-outline');
		});

		// Add 'selected' class to clicked timeslot button
		event.target.classList.remove('btn-bd-outline');
		event.target.classList.add('btn-bd-schedule');

		// Get the chosen timeslot
		const chosenTimeslot = event.target.textContent;
		//Get the selected data
		const selectedDate = datepicker.selectedDates[0];
		selectedAppointment = {
			day: selectedDate.getDate(),
			month: selectedDate.getMonth() + 1,
			year: selectedDate.getFullYear(),
			timeZone: selectedDate.toTimeString().match(/\((.+)\)/)[1],
			time: chosenTimeslot,
		};
		updateUI(selectedAppointment);
		// Show the modal
		appointmentModal.show();
	}

	// Handle the form submission
	const appointmentForm = document.getElementById('appointmentForm');
	const appointmentModalText = document.getElementById('modalText');
	const appointmentThanks = document.getElementById('appointmentThanks');
	const appointmentSubmit = document.getElementById('appointmentSubmit');

	appointmentForm.addEventListener('submit', (event) => {
		event.preventDefault();
		if (!phoneInput.isValidNumber()) {
			message.innerHTML = 'Invalid number. Please try again.';
			return false;
		}
		// Get the Forms values and add them to the selectedAppointment object
		selectedAppointment.firstName = document.getElementById('inputFirstName').value;
		selectedAppointment.lastName = document.getElementById('inputLastName').value;

		selectedAppointment.email = document.getElementById('inputEmail').value;
		const country_code = phoneInput.getSelectedCountryData().dialCode;

		const phone = phoneInput.getNumber(intlTelInputUtils.numberFormat.NATIONAL);
		// listen to the telephone input for changes

		// trigger this method once you have the form data captured within you web form.  This means you have to capture the form submission events and data.
		__ctm.form.track(
			'app.calltrackingmetrics.com', // the capture host
			'FRT472ABB2C5B9B141A5EC69931BA61CBF7611D6F23084E4AC728BEF3FAACF3ED4F', // this FormReactor
			'8775641385',
			{
				country_code: country_code, // the expected country code e.g. +1, +44, +55, +61, etc... the plus is excluded
				name: selectedAppointment.firstName + ' ' + selectedAppointment.lastName,
				phone: phone,
				email: selectedAppointment.email,
				custom: {
					appointment_date: `${selectedAppointment.month}/${selectedAppointment.day}/${selectedAppointment.year}`,
					appointment_time: selectedAppointment.time,
					appointment_time_zone: selectedAppointment.timeZone,
				},
			},
		);

		posthog.identify(
			selectedAppointment.email, // Replace 'distinct_id' with your user's unique identifier
			{
				email: selectedAppointment.email,
				name: selectedAppointment.firstName + ' ' + selectedAppointment.lastName,
				phone: phone,
			}, // optional: set additional user properties
		);

		appointmentModalText.classList.add('d-none');

		appointmentSubmit.innerHTML = '';
		//add a button to close the modal
		const closeButton = document.createElement('button');
		closeButton.classList.add('btn', 'btn-bd-outline', 'm-1', 'appointment-slot', 'fw-bold');
		closeButton.textContent = 'Close';
		closeButton.addEventListener('click', function () {
			appointmentModal.hide();
		});
		appointmentThanks.classList.remove('d-none');
		appointmentSubmit.appendChild(closeButton);
	});

	/***********************************************************************
	 * 	Contact Modal and Form Reactor
	 *
	 *
	 *
	 *
	 *
	 ************************************************************************/
	//Initalize Bootstrap modal
	const getHelpModal = new Modal('#getHelpModal', {
		keyboard: false,
		backdrop: 'static',
	});
	const getHelpForm = document.getElementById('getHelpForm');
	const getHelpModalText = document.getElementById('getHelpModalText');
	const getHelpThanks = document.getElementById('getHelpThanks');
	const getHelpSubmit = document.getElementById('getHelpSubmit');

	let phoneHelp = document.getElementById('getHelpInputPhone');
	const phoneInputHelp = window.intlTelInput(phoneHelp, {
		utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js',
	});

	getHelpForm.addEventListener('submit', (event) => {
		event.preventDefault();
		if (!phoneInputHelp.isValidNumber()) {
			message.innerHTML = 'Invalid number. Please try again.';
			return false;
		}
		// Get the Forms values and add them to the selectedAppointment object
		let firstNameHelp = document.getElementById('getHelpInputFirstName').value;
		let lastNameHelp = document.getElementById('getHelpInputLastName').value;
		let emailHelp = document.getElementById('getHelpInputEmail').value;

		let messageHelp = document.getElementById('getHelpTextArea').value;

		const country_codeHelp = phoneInputHelp.getSelectedCountryData().dialCode;

		const phoneHelp = phoneInputHelp.getNumber(intlTelInputUtils.numberFormat.NATIONAL);
		// listen to the telephone input for changes

		// trigger this method once you have the form data captured within you web form.  This means you have to capture the form submission events and data.
		__ctm.form.track(
			'app.calltrackingmetrics.com', // the capture host
			'FRT472ABB2C5B9B141A5EC69931BA61CBF7871CF1AA3E1AB8AA4EEABB99EB34484A', // this FormReactor
			'8775641385',
			{
				country_code: country_codeHelp, // the expected country code e.g. +1, +44, +55, +61, etc... the plus is excluded
				name: firstNameHelp + ' ' + lastNameHelp,
				phone: phoneHelp,
				email: emailHelp,
				custom: {
					how_can_we_help: messageHelp,
				},
			},
		);

		posthog.identify(
			emailHelp, // Replace 'distinct_id' with your user's unique identifier
			{
				email: emailHelp,
				name: firstNameHelp + ' ' + lastNameHelp,
				phone: phoneHelp,
			}, // optional: set additional user properties
		);

		getHelpModalText.classList.add('d-none');

		getHelpSubmit.innerHTML = '';
		//add a button to close the modal
		const closeButton = document.createElement('button');
		closeButton.classList.add('btn', 'btn-bd-outline', 'm-1', 'appointment-slot', 'fw-bold');
		closeButton.textContent = 'Close';
		closeButton.addEventListener('click', function () {
			getHelpModal.hide();
		});
		getHelpThanks.classList.remove('d-none');
		getHelpSubmit.appendChild(closeButton);
	});
	//Reset Form when Modal is closed
	getHelpModal._element.addEventListener('hidden.bs.modal', function (event) {
		getHelpThanks.classList.add('d-none');
		getHelpForm.reset();
	});
	//Reset Form when Modal is opened
	getHelpModal._element.addEventListener('shown.bs.modal', function (event) {
		getHelpModalText.classList.remove('d-none');
		getHelpThanks.classList.add('d-none');
		//remove the close button
		getHelpSubmit.innerHTML = '';
		// readd the submit and cancel buttons
		const submitButton = document.createElement('button');
		submitButton.classList.add('btn', 'btn-bd-schedule');
		submitButton.textContent = 'Submit';
		submitButton.setAttribute('type', 'submit');

		const cancelButton = document.createElement('button');
		cancelButton.classList.add('btn', 'btn-secondary');
		cancelButton.textContent = 'Cancel';
		cancelButton.setAttribute('type', 'button');
		cancelButton.setAttribute('data-bs-dismiss', 'modal');
		getHelpSubmit.appendChild(cancelButton);
		getHelpSubmit.appendChild(submitButton);
	});
};

const flipDuration = 1000;
const flipEndDelay = 5000;
const shuffleDuration = 1000;
const shuffleEndDelay = 1000;

const initialSlideDuration = 170;
const normalSlideDuration = 80;
/*
window.onload = function (e) {
  const myCarouselElement = document.querySelector(
    "#carouselExampleIndicators"
  );
  const carouselIndicators = myCarouselElement.querySelectorAll(
    ".carousel-indicators button span"
  );
  const carousel = bootstrap.Carousel.getOrCreateInstance(myCarouselElement);
  carousel.pause(true);

  let intervalID;

  fillCarouselIndicator(0);

  myCarouselElement.addEventListener("slide.bs.carousel", function (e) {
    let index = e.to;
    fillCarouselIndicator(++index);
  });

  function fillCarouselIndicator(index) {
    let i = 0;
    // 2
    for (const carouselIndicator of carouselIndicators) {
      carouselIndicator.style.width = 0;
    }
    clearInterval(intervalID);
    // 1
    carousel.pause(true);

    let slideDuration = normalSlideDuration;
    if (index === 0) {
      slideDuration = initialSlideDuration;
    }

    intervalID = setInterval(function () {
      i++;
      myCarouselElement.querySelector(
        ".carousel-indicators .active span"
      ).style.width = i + "%";
      if (i >= 100) {
        // 3
        carousel.next();
      }
    }, slideDuration);
  }
};
*/
const runningAnims = anime.running;

let repeatAnimation = anime.timeline({
	loop: true,
	easing: 'cubicBezier(1.000, -0.255, 0.535, 0.905)',
});

let startLoop = anime
	.timeline({
		easing: 'cubicBezier(1.000, -0.255, 0.535, 0.905)',

		complete: function (anim) {
			anim.set('#slide-set-1', {
				opacity: 0,
			});
			anim.remove('#slide-set-1 .slide-holder');
			repeatAnimation.set('.slide-holder2', {
				opacity: 1,
			});
			repeatAnimation
				.add(
					{
						targets: '#slide-set-2 .slide-holder2',
						easing: 'cubicBezier(0.680, -0.550, 0.265, 1.550)',
						translateY: [
							{
								value: '-=25',
								duration: flipDuration,
								endDelay: flipEndDelay,
							},
							{
								value: '-=25',
								duration: flipDuration,
								endDelay: flipEndDelay,
							},
							{
								value: '-=25',
								duration: flipDuration,
								endDelay: flipEndDelay,
							},
						],
					},
					'+=5000',
				)
				.add({
					targets: '#slide-set-2 .slide-holder2',
					easing: 'cubicBezier(0.680, -0.550, 0.265, 1.550)',
					translateY: [
						{
							value: '+=75',
							duration: shuffleDuration,
							endDelay: shuffleEndDelay,
						},
					],
				});
			repeatAnimation.play();
		},
	})
	.set('.slide-holder', {
		top: '63px',
		opacity: 0,
	})
	.set('.slide-holder2', {
		top: '38px',
		opacity: 0,
	})
	.add({
		targets: '#slide-set-1 .slide-holder',
		opacity: [{ value: 1, duration: 1000 }],
	})
	.add(
		{
			targets: '#slide-set-1 .slide-holder',
			easing: 'cubicBezier(0.680, -0.550, 0.265, 1.550)',
			translateY: [
				{ value: '-=25', duration: flipDuration, endDelay: flipEndDelay },
				{ value: '-=25', duration: flipDuration, endDelay: flipEndDelay },
				{ value: '-=25', duration: flipDuration, endDelay: flipEndDelay },
				{ value: '-=25', duration: flipDuration, endDelay: flipEndDelay },
			],
		},
		'-=800',
	)
	.add({
		targets: '#slide-set-1 .slide-holder',
		easing: 'cubicBezier(0.680, -0.550, 0.265, 1.550)',
		translateY: [
			{
				value: '+=75',
				duration: shuffleDuration,
				endDelay: shuffleEndDelay,
			},
		],
	});
