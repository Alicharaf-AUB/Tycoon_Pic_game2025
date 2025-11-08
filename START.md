# 🚀 START HERE - READ THIS FIRST

## ONE-COMMAND INSTALL

### Mac/Linux:
```bash
chmod +x install.sh
./install.sh
```

### Windows:
```
install.bat
```

That's it! The script does everything automatically.

---

## What It Does

1. ✅ Cleans old files
2. ✅ Installs all dependencies
3. ✅ Loads your 5 AIM startups
4. ✅ Gets everything ready

---

## After Install

Start the app:
```bash
npm run dev
```

Open browser:
- **Players:** http://localhost:5173
- **Admin:** http://localhost:5173/admin

Login:
- Username: `admin`
- Password: `demo123`

---

## If Script Doesn't Work

Manual install:

```bash
# 1. Kill port
lsof -ti:3001 | xargs kill -9

# 2. Install
npm install --legacy-peer-deps
cd client
npm install --legacy-peer-deps
cd ..

# 3. Load startups
npm run seed

# 4. Start
npm run dev
```

---

## Your 5 AIM Startups

All loaded and ready:

1. **Mina Canaan** - Marine technology
2. **IGT** - Green energy solutions  
3. **Impersonas** - Digital humans
4. **Schedex** - AI scheduling
5. **Bilo** - Ad platform

---

## Production Deploy

See: **DEPLOY_NOW.md**

---

## Need Help?

1. Make sure Node.js is installed: `node -v`
2. Run the install script
3. If errors, copy/paste the error and check docs

---

**Everything is ready. Just run the install script!** 🎉
