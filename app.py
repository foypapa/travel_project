import re

from flask import Flask, abort, redirect, render_template, request, url_for

app = Flask(__name__)

# -----------------------------
# DESTINATIONS DATA
# -----------------------------

destinations = {
    "goa": {
        "slug": "goa",
        "name": "Goa",
        "image": "goa.webp",
        "tagline": "Coastal elegance with private beachside experiences.",
        "description": "A refined mix of golden beaches, boutique stays, sunset cruises, and vibrant food culture.",
    },
    "kashmir": {
        "slug": "kashmir",
        "name": "Kashmir",
        "image": "kashmir.webp",
        "tagline": "Alpine serenity with iconic valley views.",
        "description": "Snow-lined peaks, peaceful lakefront moments, heritage gardens, and deeply scenic mountain routes.",
    },
    "ladakh": {
        "slug": "ladakh",
        "name": "Ladakh",
        "image": "ladakh.webp",
        "tagline": "High-altitude journeys for bold travelers.",
        "description": "Dramatic landscapes, monastery trails, curated adventure drives, and premium remote-luxury escapes.",
    },
}

# -----------------------------
# PACKAGES DATA
# -----------------------------

packages = {
    "goa-luxury-escape": {
        "slug": "goa-luxury-escape",
        "destination": "goa",
        "name": "Goa Luxury Escape",
        "price": "INR 14,999",
        "duration": "4 Days / 3 Nights",
        "image": "goa.webp",
        "summary": "Premium beachfront stay, curated dining, and sunset sailing.",
        "highlights": [
            "Private airport transfer",
            "Sunset yacht experience",
            "Chef-led coastal dining",
        ],
        "includes": [
            "Luxury accommodation",
            "Daily breakfast",
            "Guided local experiences",
            "On-trip concierge support",
        ],
    },
    "kashmir-romantic-retreat": {
        "slug": "kashmir-romantic-retreat",
        "destination": "kashmir",
        "name": "Kashmir Romantic Retreat",
        "price": "INR 28,999",
        "duration": "6 Days / 5 Nights",
        "image": "kashmir.webp",
        "summary": "Lake-view moments, scenic drives, and refined boutique comfort.",
        "highlights": [
            "Private shikara ride",
            "Premium valley-view stays",
            "Curated couples experiences",
        ],
        "includes": [
            "Luxury accommodation",
            "Daily breakfast and dinner",
            "Guided sightseeing",
            "24/7 travel assistance",
        ],
    },
    "ladakh-adventure-trail": {
        "slug": "ladakh-adventure-trail",
        "destination": "ladakh",
        "name": "Ladakh Adventure Trail",
        "price": "INR 32,999",
        "duration": "7 Days / 6 Nights",
        "image": "ladakh.webp",
        "summary": "High-altitude road journeys with comfort-first expedition planning.",
        "highlights": [
            "Curated overland route",
            "Premium camp and hotel mix",
            "Expert local trip captain",
        ],
        "includes": [
            "Handpicked accommodation",
            "Breakfast and select meals",
            "Route permits and logistics",
            "Dedicated support throughout the trip",
        ],
    },
}

# In-memory capture for demo usage.
received_enquiries = []
received_bookings = []

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def valid_email(value):
    return bool(EMAIL_RE.match(value))


def valid_phone(value):
    digits = re.sub(r"\D", "", value)
    return 7 <= len(digits) <= 15


@app.route("/")
def home():
    featured_destinations = list(destinations.values())
    featured_packages = list(packages.values())
    enquiry_status = request.args.get("enquiry", "").strip().lower()

    enquiry_message = ""
    if enquiry_status == "success":
        enquiry_message = "Your enquiry has been received. Our team will contact you shortly."
    elif enquiry_status == "error":
        enquiry_message = "Please complete all enquiry fields with valid details."

    return render_template(
        "home.html",
        featured_destinations=featured_destinations,
        featured_packages=featured_packages,
        enquiry_status=enquiry_status,
        enquiry_message=enquiry_message,
    )


@app.route("/enquiry", methods=["POST"])
def enquiry():
    full_name = request.form.get("name", "").strip()
    mobile = request.form.get("mobile", "").strip()
    email = request.form.get("email", "").strip()
    country = request.form.get("country", "").strip()
    query_text = request.form.get("query", "").strip()

    if (
        len(full_name) < 2
        or not valid_phone(mobile)
        or not valid_email(email)
        or not country
        or len(query_text) < 10
    ):
        return redirect(f"{url_for('home', enquiry='error')}#enquiry")

    received_enquiries.append(
        {
            "name": full_name,
            "mobile": mobile,
            "email": email,
            "country": country,
            "query": query_text,
        }
    )
    return redirect(f"{url_for('home', enquiry='success')}#enquiry")


@app.route("/destination/<name>")
def destination(name):
    destination_data = destinations.get(name.lower())
    if not destination_data:
        abort(404)

    related_packages = [
        package
        for package in packages.values()
        if package["destination"] == destination_data["slug"]
    ]

    return render_template(
        "destination.html",
        destination=destination_data,
        related_packages=related_packages,
    )


@app.route("/package/<name>")
def package(name):
    package_data = packages.get(name.lower())
    if not package_data:
        abort(404)

    return render_template("package.html", package=package_data)


@app.route("/booking/<name>", methods=["GET", "POST"])
def booking(name):
    package_data = packages.get(name.lower())
    if not package_data:
        abort(404)

    booking_error = ""
    booking_form = {"name": "", "email": "", "phone": ""}

    if request.method == "POST":
        booking_form = {
            "name": request.form.get("name", "").strip(),
            "email": request.form.get("email", "").strip(),
            "phone": request.form.get("phone", "").strip(),
        }

        if (
            len(booking_form["name"]) < 2
            or not valid_email(booking_form["email"])
            or not valid_phone(booking_form["phone"])
        ):
            booking_error = "Please enter a valid name, email, and phone number."
        else:
            received_bookings.append(
                {
                    "package": package_data["slug"],
                    "name": booking_form["name"],
                    "email": booking_form["email"],
                    "phone": booking_form["phone"],
                }
            )
            return redirect(
                url_for(
                    "thank_you",
                    package=package_data["name"],
                    name=booking_form["name"],
                )
            )

    return render_template(
        "booking.html",
        package=package_data,
        booking_error=booking_error,
        booking_form=booking_form,
    )


@app.route("/thank-you")
def thank_you():
    package_name = request.args.get("package", "your selected package")
    guest_name = request.args.get("name", "Traveler")
    return render_template(
        "thank_you.html",
        package_name=package_name,
        guest_name=guest_name,
    )


if __name__ == "__main__":
    app.run(debug=True)
