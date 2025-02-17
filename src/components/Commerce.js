import React, { useState } from "react";
import { Box, Grid, Card, CardMedia, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, CircularProgress, Snackbar, Alert } from "@mui/material";
import axios from "axios";

const products = [
  { id: 1, name: "iphone", price: 10000, discount: "5-10%", image: "/images/phone.jpg" },
  { id: 2, name: "laptop", price: 12000, discount: "10-15%", image: "/images/laptop.jpg" },
  { id: 3, name: "headphones", price: 3000, discount: "5-8%", image: "/images/headphones.jpg" },
  { id: 4, name: "diamond", price: 45000, discount: "15-20%", image: "/images/diamond.jpg" },
  { id: 5, name: "dinner", price: 8000, discount: "15-20%", image: "/images/dinner.jpg" },
  { id: 6, name: "dinnerset", price: 20000, discount: "15-20%", image: "/images/dinnerset.jpg" },
  { id: 7, name: "earings", price: 35000, discount: "15-20%", image: "/images/earings.jpg" },
  { id: 8, name: "gamer", price: 74500, discount: "15-20%", image: "/images/gamer.jpg" },
  { id: 9, name: "golden", price: 4500, discount: "15-20%", image: "/images/golden.jpg" },
  { id: 10, name: "camera", price: 47000, discount: "15-20%", image: "/images/camera.jpg" },
  { id: 11, name: "Smartwatch", price: 45000, discount: "15-20%", image: "/images/smartwatch.jpg" },
  { id: 12, name: "Sugarholder", price: 4500, discount: "15-20%", image: "/images/sugar.jpg" },
];

const consumerKey = "5SqqBeXV88xbbAdQGILC4iHcGHCSwLL2z6nJ2o6nbngHQagP";
const consumerSecret = "NliIMiLkk8w33kWRr3GnlH5qRsk2cDp5kPwpdaRKQ1nRFHuq7WvKOcd1qGJoxg2V";
const BusinessShortCode = "174379";
const Passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0b6a3bdc9603a7c172c6366b5d3b58";
const CallBackURL = "https://your-callback-url.com/mpesa/callback";

const Commerce = () => {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", severity: "success" });
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleBuyClick = (product) => {
    setSelectedProduct(product);
    setOpen(true);
  };

  const getAccessToken = async () => {
    const credentials = btoa(`${consumerKey}:${consumerSecret}`);
    try {
      const response = await axios.get(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        }
      );
      return response.data.access_token;
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  };

  const handlePayment = async () => {
    if (!phone.match(/^254\d{9}$/)) {
      setMessage({ text: "Enter a valid Safaricom phone number (format: 2547XXXXXXXX)", severity: "error" });
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Failed to retrieve access token");
      
      const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");
      const password = btoa(`${BusinessShortCode}${Passkey}${timestamp}`);
      
      const { data } = await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
        BusinessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: selectedProduct.price,
        PartyA: phone,
        PartyB: BusinessShortCode,
        PhoneNumber: phone,
        CallBackURL,
        AccountReference: selectedProduct.name,
        TransactionDesc: `Payment for ${selectedProduct.name}`,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (data.ResponseCode === "0") {
        setMessage({ text: "STK Push request sent! Check your phone.", severity: "success" });
      } else {
        setMessage({ text: "Payment request failed. Try again.", severity: "error" });
      }
    } catch (error) {
      setMessage({ text: "Error processing payment.", severity: "error" });
    }
    setLoading(false);
    setSnackbarOpen(true);
    setOpen(false);
  };

  return (
    <Box sx={{ p: 3, background: "#f5f5f5", textAlign: "center" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold", color: "#333" }}>
        Welcome to My E-Commerce Sales
      </Typography>
      <Grid container spacing={2} justifyContent="center">
        {products.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={3}>
            <Card sx={{ maxWidth: 250, borderRadius: 2, boxShadow: 3 }}>
              <CardMedia component="img" height="140" image={product.image} alt={product.name} />
              <CardContent>
                <Typography variant="h6">{product.name}</Typography>
                <Typography variant="body2">Price: KES {product.price}</Typography>
              </CardContent>
              <Box sx={{ p: 2, display: "flex", justifyContent: "space-between" }}>
                <Button variant="contained" color="primary" onClick={() => handleBuyClick(product)}>Buy</Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Enter Phone Number</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Phone Number (2547XXXXXXXX)"
            type="tel"
            fullWidth
            variant="outlined"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handlePayment} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Proceed"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={message.severity}>
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Commerce;
