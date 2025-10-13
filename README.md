# Banking Dashboard (LocalStorage + Bootstrap)

This is a simple React demo project that uses **localStorage** for authentication, balances, transactions, and notifications.
It also includes a **PDF download** feature using `jsPDF`.

## Run locally

1. Extract the ZIP.
2. In the project folder run:
   ```
   npm install
   npm start
   ```

**Notes**
- Users are stored in localStorage key `users`.
- Logged-in user is stored in `currentUser`.
- Transactions are stored per-user in `transactions_<email>`.
- Notifications in `notifications_<email>`.
