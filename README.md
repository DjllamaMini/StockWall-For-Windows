# TickerWall

A clean, full-screen multi-monitor stock wall for Windows. It opens one borderless dashboard on every connected display, offsets the stock rotation per monitor, and changes the shown stock every minute.

## Run on Windows

1. Install [Node.js LTS](https://nodejs.org/).
2. In this folder, run `npm install` then `npm run start`.
3. Use the gear button (or `Ctrl` + `,`) on any monitor to manage your wall. Press `Esc` outside the settings panel to exit.

## Create a Windows installer

Run `npm install` once, then run:

```bash
npm run dist:win
```

This creates `dist/TickerWall-Setup-<version>.exe`, a standard Windows installer. It lets the person installing choose an install location and creates both Start Menu and desktop shortcuts.

For a no-install portable executable instead, run `npm run dist:win:portable`. Build output is placed in `dist/`.

### Download a prebuilt installer from GitHub

The repository includes a Windows GitHub Actions build at `.github/workflows/build-windows-installer.yml`. To get a prebuilt installer without installing Node locally:

1. Open the repository's **Actions** tab and select **Build Windows installer**.
2. Select **Run workflow** and wait for the `Create TickerWall Setup.exe` job to finish.
3. Open that completed run and download the **TickerWall-Windows-Installer** artifact. It contains `TickerWall-Setup-<version>.exe`.

The workflow runs on a Windows build machine and retains the downloadable installer artifact for 30 days. A new installer is also created automatically when a version tag such as `v1.0.0` is pushed.

## Use it

- Add any NYSE ticker symbol to the rotation. TickerWall refreshes the active stock's price from Yahoo Finance every 10 seconds, including while it remains on screen between rotations.
- Yahoo Finance is a best-effort, free data source. Quotes can be delayed or rate-limited and should not be used for trading decisions.
- Enter **shares** and **average cost** next to a symbol under **Holdings**. When that stock comes up on a screen, its unrealized dollar and percentage return appear beneath the quote.
- Changes made in settings are sent immediately to all monitor windows and saved locally on the computer.

The app includes a small sample wall and two sample holdings so it is useful on first launch. Use **Restore demo** to bring those back after editing.
