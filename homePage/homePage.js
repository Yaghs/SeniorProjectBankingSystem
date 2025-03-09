document.addEventListener("DOMContentLoaded", function() {
    // Update username from localStorage
    const user = localStorage.getItem("loggedInUser");
    if (user) {
        document.getElementById("username").textContent = user;
    }

    //Function for the corousel effect for the boxes
    function initializeCarousel(wrapper, leftArrow, rightArrow) {
        // This function sets up the carousel for a given wrapper element
        // and attaches event listeners to the provided left and right arrow buttons.
        const carousel = wrapper.querySelector(".carousel");
        // Create an array from all children of the carousel (each box).
        const boxes = Array.from(carousel.children);
        // Set the number of boxes that should be visible at one time.
        const visibleBoxes = 3; // Adjust this value if needed.
        // For infinite scrolling, clone each box once and add one set at the beginning
        // and one set at the end of the carousel.
        boxes.forEach((box) => {
            const cloneLeft = box.cloneNode(true);
            const cloneRight = box.cloneNode(true);
            carousel.insertBefore(cloneLeft, carousel.firstChild);
            carousel.appendChild(cloneRight);
        });
        // Set the starting index of the carousel to the first original box.
        // Because we've prepended clones, the original boxes now start at index 'visibleBoxes'.
        let index = visibleBoxes;
        // Store the total number of original boxes.
        const totalBoxes = boxes.length;
        // Calculate the width of one box plus additional horizontal margin.
        // Here, we assume a total margin of 20px (10px on each side).
        const boxWidth = boxes[0].offsetWidth + 20;

        // Define a function to update the carousel's position based on the current index.
        // The 'animate' parameter controls whether the movement is animated.
        function updateCarousel(animate = true) {
            // Set the CSS transition property if animation is desired.
            carousel.style.transition = animate ? "transform 0.5s ease-in-out" : "none";
            // Update the CSS transform to slide the carousel to the correct position.
            carousel.style.transform = `translateX(${-index * boxWidth}px)`;
        }

        // Initialize the carousel position without animation.
        updateCarousel(false);

        rightArrow.addEventListener("click", () => {
            // Increment the index to move right.
            index++;
            // Update the carousel with animation.
            updateCarousel();
            // If the index goes below the first original box,
            // wait for the transition to complete, then reset the index to the end.
            if (index >= totalBoxes + visibleBoxes) {
                setTimeout(() => {
                    // Set the index to the last original box's position.
                    index = visibleBoxes;
                    // Update the carousel instantly (without animation).
                    updateCarousel(false);
                }, 500); // Match the transition duration
            }
        });

        leftArrow.addEventListener("click", () => {
            // Decrement the index to move left.
            index--;
            // Update the carousel with animation.
            updateCarousel();
            // If the index goes below the first original box,
            // wait for the transition to complete, then reset the index to the end.
            if (index < visibleBoxes) {
                setTimeout(() => {
                    // Set the index to the last original box's position.
                    index = totalBoxes + visibleBoxes - 1;
                    // Update the carousel instantly (without animation).
                    updateCarousel(false);
                }, 500); // Timeout matches the transition duration.
            }
        });
    }

    // Selects all carousel wrapper elements on the page.
    const carouselWrappers = document.querySelectorAll(".carousel-wrapper");

    // Check if there are at least two carousel wrappers.
    if (carouselWrappers.length >= 2) {
        // Initializes the first carousel:
        // - Uses the first wrapper.
        // - Selects the left arrow using the class '.arrow.left'.
        // - Selects the right arrow using the class '.arrow.right'.
        initializeCarousel(
            carouselWrappers[0],
            document.querySelector(".arrow.left"),
            document.querySelector(".arrow.right")
        );
        // Initializes the second carousel:
        // - Uses the second wrapper.
        // - Selects the left arrow using the class '.arrow.left2'.
        // - Selects the right arrow using the class '.arrow.right2'.
        initializeCarousel(
            carouselWrappers[1],
            document.querySelector(".arrow.left2"),
            document.querySelector(".arrow.right2")
        );
    } else if (carouselWrappers.length === 1) {
        // If there's only one carousel wrapper, initialize it using the first set of arrows.
        initializeCarousel(
            carouselWrappers[0],
            document.querySelector(".arrow.left"),
            document.querySelector(".arrow.right")
        );
    }

// --- Dropdown Toggle Code ---
    const accountLink = document.getElementById("accountLink");
    const dropdownContent = document.querySelector(".dropdown-content");

    accountLink.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent default link behavior
        dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
    });

    // Close dropdown when clicking outside
    window.addEventListener("click", function (event) {
        if (!event.target.matches("#accountLink")) {
            dropdownContent.style.display = "none";
        }
    });
});