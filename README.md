# 🥛 DairyPad

An ergonomic, touch-friendly dairy delivery notepad web application built with **Bootstrap 5**, designed to quickly compile and dispatch daily dairy orders to a milkman via **WhatsApp** in a clean, standardized format.

---

## 📱 WhatsApp Message Format

Clicking **Send** formats the selected items and opens WhatsApp with the exact fixed message structure:

```text
<Date>
<Item> - <Quantity> <Unit>
```

### Example:
```text
16 October 2026
Milk - 1.5 Kg
Curd - 1 Kg
Paneer - 0.5 Kg
```

---

## ✨ Current Features

### 📅 Date Navigation
- **Clear Date Display**: Prominently shows the delivery date (e.g., `16 October 2026`) in large, legible typography.
- **Quick Arrow Controls**: Step back or forward by 1 day using `<` and `>` buttons. Buttons return immediately to their clean, transparent state with no sticky focus or color shifts.
- **Native Calendar Picker**: Clicking the date box triggers the device's native HTML5 date picker for selecting any past or future date.

### 🥛 Dairy Product List
- **Preloaded Essentials**: Includes **Milk**, **Ghee**, and **Curd**.
- **Milk Default**: Milk always defaults to **1.5 Kg** and is pre-checked on startup.
- **Smart Formatting**:
  - Displays as an integer if decimal points are zero (e.g., `1` instead of `1.000`).
  - Displays 1 decimal place if ending with `.X00` (e.g., `1.5` instead of `1.500`).
  - Displays up to 3 decimal places for fractional amounts (e.g., `0.250`).
- **Interactive Selection Rules**:
  - Clicking any product row or checkbox ticks and activates it.
  - Clicking an already active item unticks it.
  - An unticked item can never remain active.
  - Units can be toggled per item (`Kg`, `L`, `g`, `ml`), defaulting to `Kg`.

### ➕ Custom Items
- **Quick Add Row**: Add any custom dairy product (e.g., *Paneer*, *Butter*, *Cream*) directly below the main list.
- **Blank Default Quantity**: Custom item quantity starts blank (`""`) so you can type or step the exact quantity you want.
- **Persistence**: Newly added custom items persist in the browser (`localStorage`) for future sessions, with an option to remove them at any time.

### 🔘 Bottom Step Controls
- **Docked to Bottom**: `[ - ] [ +0.5 ] | [ +1.0 ] [ - ]` are pinned to the bottom dock for thumb-reach access.
- **Pure Click Animation**: Clicking `+` or `-` triggers a tactile press-down animation (`scale(0.91)`) with zero color, outline, or border shifts after the click.

### 🚀 Send & Settings
- **One-Click Send**: Tapping the **Send** button immediately prepares the message and launches WhatsApp.
- **3-Second Press-and-Hold to Change Number**:
  - Pressing and holding the **Send** button for 3 seconds displays a smooth sliding progress fill.
  - Once full, a clean modal prompts: *"Enter a 10 digit whatsapp number"*.
  - Saves the updated number directly to `.env` via the Express backend without page reload.
  - Regular quick clicks do not display the sliding animation.

### 👵 Senior-Friendly & Zero-Scroll
- **High-Contrast Readability**: Extra-large text (`1.35rem` bold titles and numbers), large checkboxes (`1.65rem`), and high-contrast color palette.
- **Zero Scroll**: Fitted to `100dvh` for a native-app feel on both mobile phones and desktop displays.
- **Curated Palette**:
  - Canvas: `#FCF8F3` (Cream)
  - Borders: `#AEDADD` (Soft Mint)
  - Accents: `#DB996C` (Caramel / Ghee Gold)
  - Text: `#6E7DA2` (Slate Indigo)

---

## 🔮 Future Roadmap

1. **Monthly Milkman Expense Calculation**:
   - Set fixed unit rates per item (e.g., ₹60/Kg for Milk, ₹600/Kg for Ghee, ₹80/Kg for Curd).
   - Automatically calculate monthly delivery totals and total bill amount payable to the milkman based on logged daily deliveries.
2. **Monthly Bill Dispatch to Milkman**:
   - Generate a summarized monthly statement breakdown.
   - Send the monthly calculated statement directly to the milkman via WhatsApp in one tap.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Custom Variables & Modern Flexbox Layouts), Vanilla JavaScript (ES6+).
- **Styling**: Bootstrap 5.3.3 & Bootstrap Icons.
- **Backend**: Node.js & Express.
- **Audio Feedback**: Web Audio API (tactile click sounds).

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or newer recommended)
- `npm`

### 2. Installation
Clone the repository and install dependencies:
```bash
cd DairyPad
npm install
```

### 3. Environment Configuration
Create or verify your `.env` file in the project root:
```env
WHATSAPP_PHONE_NUMBER=91xxxxxxxxxx
PORT=3000
```
> **Note**: You can also update the phone number anytime by pressing and holding the **Send** button for 3 seconds inside the app.

### 4. Run the Application
```bash
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser or access it from your mobile device on the same local network.

---

## 📄 License
ISC
