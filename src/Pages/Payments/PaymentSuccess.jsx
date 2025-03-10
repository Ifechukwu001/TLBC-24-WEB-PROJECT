import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode.react";
import { jsPDF } from "jspdf";
import qrcode from "qrcode";
import Navbar from "../../Components/Navbar";
import Footer from "../../Components/Footer";

const PaymentSuccessCard = () => {
  const [paymentData, setPaymentData] = useState(null);
  const [group, setGroup] = useState(null);
  const [error, setError] = useState(null);
  const qrCodeRef = useRef(null);

  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === `${name}=`) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const transactionId = urlParams.get("transaction_id");

        if (!transactionId) {
          throw new Error("No transaction ID found in the URL");
        }

        console.log("Sending request with transaction ID:", transactionId);

        const formData = { transaction_id: transactionId };

        const response = await fetch(
          "https://lord-s-brethren-payment.onrender.com/api/payment/verify/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFTOKEN": getCookie("csrftoken"),
            },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === "success") {
          let fullName;
          if (data.details.name) {
            fullName = data.details.name;
          } else if (data.details.firstname && data.details.lastname) {
            fullName = `${data.details.firstname} ${data.details.lastname}`;
          } else {
            fullName = "N/A";
          }

          setPaymentData({
            ...data.details,
            name: fullName
        });
          setGroup(data.group);
        } else {
          throw new Error(data.message || "Payment verification failed");
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
        setError(
          err.message || "An error occurred while verifying the payment"
        );
      }
    };

    verifyPayment();
  }, []);

  if (error) {
    return (
        <div className="alert alert-danger" role="alert">
        <strong>Error!</strong> {error}
      </div>
    );
  }

  if (!paymentData) {
    return <div className="text-center">Loading payment information...</div>;
  }
  const downloadReceipt = async () => {
    if (!paymentData) return;

    const doc = new jsPDF();

    // Add receipt details
    doc.setFontSize(20);
    doc.text("Payment Receipt", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Personal Information:", 20, 30);
    doc.setFont(undefined, "normal");
    doc.text(`Name: ${paymentData.name}`, 30, 40);
    doc.text(`Phone Number: ${paymentData.phone}`, 30, 50);
    doc.text(`Email: ${paymentData.email}`, 30, 60);
    doc.text(`Reference: ${paymentData.reference}`, 30, 70);

    doc.setFont(undefined, "bold");
    doc.text("Payment Details:", 20, 85);
    doc.setFont(undefined, "normal");

    doc.text(`Amount Paid: ${paymentData.amount}`, 30, 95);
    doc.text(`Group: ${group}`, 30, 105);
    doc.text(`Date: ${new Date().toLocaleString()}`, 30, 115);

    try {
      const qrCodeDataUrl = await qrcode.toDataURL(qrCodeData);
      doc.addImage(qrCodeDataUrl, "PNG", 70, 140, 70, 70);
    } catch (err) {
      console.error("Error generating QR code:", err);
    }

    // Save the PDF
    doc.save(`payment_receipt_${paymentData.name}.pdf`);
  };
  // Generate QR code
  const qrCodeData = JSON.stringify({
    name: paymentData.name,
    phone: paymentData.phone,
    email: paymentData.email,
    reference: paymentData.reference,
    amount: paymentData.amount,
    group: group,
  });

  return (
    <>
    <Navbar />
    <div className="container py-3">
    <div className="card mx-auto" style={{ maxWidth: '42rem' }}>
      <div className="card-body p-3">
        <h6 className="text-uppercase font-weight-bold mb-2" 
      style={{ color: 'green', textAlign: 'center', fontSize: '24px' }}>
          Payment Successful
        </h6>
        <h2 className="card-title mb-3"
        style={{ textAlign: 'center', fontSize: '32px' }}
        >
          Thank you for your payment
        </h2>
          <div className="mb-3" style={{ fontSize: '18px' }} >
            <p className="mb-1"><strong>Name:</strong> {paymentData.name}</p>
            <p className="mb-1"><strong>Phone:</strong> {paymentData.phone}</p>
            <p className="mb-1"><strong>Email:</strong> {paymentData.email}</p>
            <p className="mb-1"><strong>Reference:</strong> {paymentData.reference}</p>
            <p className="mb-1"><strong>Amount Paid:</strong> ₦{paymentData.amount}</p>
            <p className="mb-1"><strong>Category:</strong> {group}</p>
            {paymentData.country && <p className="mb-1"><strong>Country:</strong> {paymentData.country}</p>}
          </div>
          <div className="d-flex justify-content-center mb-2">
            <QRCode
              value={qrCodeData} 
              size={180}
              ref={qrCodeRef}
            />
          </div>
          <p className="text-center text-muted small mb-3">
            Scan this QR code to verify your payment
          </p>
          <div className="text-center">
          <button
            onClick={downloadReceipt}
            className="btn btn-success" 
            style={{ minWidth: '200px' }}
          >
            Download Receipt with QR Code
          </button>
        </div>
      </div>
    </div>
    </div>
    <Footer />
    </>
  );
};

export default PaymentSuccessCard;
