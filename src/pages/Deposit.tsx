import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Loader } from '../components/Loader';

export const Deposit: React.FC = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const location = useLocation();
    const { amount, wallet, planName } = location.state || { amount: 0, wallet: 'deposit', planName: 'Investment' };
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [btcAddress] = useState('bc1qjvefn35nvcjamms7zxnw3509sckq78hkn7xagc');
    const [ethAddress] = useState("0xE4022eA94C80E461626bE64A06F3f3A5cB00938A")
    const [btcAmount, setBtcAmount] = useState<string>('0');
    const [isLoading, setIsLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchBtcPrice = async () => {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
                const data = await response.json();
                const btcPrice = data.bitcoin.usd;
                setBtcAmount((amount / btcPrice).toFixed(8));
                setIsLoading(false);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    setIsLoading(false);
                }
            }
        };

        fetchBtcPrice();
    }, [amount]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedFile) {
            alert('Please select a proof of payment file');
            return;
        }

        setUploading(true);

        try {
            // Prepare form data for Cloudinary
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('upload_preset', 'Profitablefxtpro'); // Replace with your actual preset
            formData.append('folder', 'deposits'); // Optional: Define a folder in Cloudinary

            
            // Upload to Cloudinary
            const uploadResponse = await axios.post(
                `https://api.cloudinary.com/v1_1/djyud9uky/image/upload`, // Replace with your Cloudinary cloud name
                formData,
            );
            
            const data = await uploadResponse.data;
            
            if (!data.secure_url) {
                throw new Error('Cloudinary upload failed');
            }
            
            const imageUrl = data.secure_url;
            
            const depositData = {
                userName: JSON.parse(localStorage.getItem('currentUser') || '{}').username,
                proof: imageUrl,
                amount: amount.toString(),
                plan: planName,
                btc: btcAmount,
                wallet
            }
            // Send deposit data to your backend
            await axios.post(`${apiUrl}/deposit`, depositData , {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
            });

            setSuccess('Deposit submitted successfully');
            setUploading(false);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setError('Failed to upload proof of payment');
                setUploading(false);
            }
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {
                amount === 0 && <p className="text-red-500 text-center">Please select an investment plan and deposit</p>
            }
            <div className="bg-[#130b2f] rounded-xl p-4 sm:p-6 lg:p-8">
                <h1 className="text-xl text-white sm:text-2xl lg:text-3xl font-bold mb-6 lg:mb-8">Deposit Confirm</h1>

                <div className="bg-[#1a1141] rounded-xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">{wallet} Payment</h2>

                    <p className="text-gray-300">
                        You have requested to invest <span className="text-green-500">${amount.toFixed(2)} USD</span> in {planName} plan
                        using your {wallet} wallet. Please pay{' '}
                        {isLoading ? (
                            <span>Loading...</span>
                        ) : (
                            <span className="text-green-500">{btcAmount} BTC</span>
                        )}{' '}
                        for successful payment
                    </p>

                    <div>
                        <p className="text-gray-300 mb-2">Send the exact amount to the Bitcoin wallet address:</p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <code className="bg-white p-3 rounded-lg flex-1 text-sm overflow-auto">
                                {btcAddress}
                            </code>
                            <button 
                                onClick={() => copyToClipboard(btcAddress)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                Copy Address
                            </button>
                        </div>
                    </div>

                    <div>
                        <p className="text-gray-300 mb-2">Send the exact amount to the Ethereum wallet address:</p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <code className="bg-white p-3 rounded-lg flex-1 text-sm overflow-auto">
                                {ethAddress}
                            </code>
                            <button 
                                onClick={() => copyToClipboard(ethAddress)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                Copy Address
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <div>
                            <label className="block text-gray-300 mb-2">
                                Screenshot or Proof Of Payment <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-2">
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="proof-file"
                                />
                                <label
                                    htmlFor="proof-file"
                                    className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-3 rounded-lg cursor-pointer transition-colors"
                                >
                                    Upload Proof of Payment
                                </label>
                                {selectedFile && (
                                    <p className="text-sm text-gray-400">
                                        Selected: {selectedFile.name}
                                    </p>
                                )}
                                <p className="text-xs text-purple-400">
                                    Supported formats: jpg, jpeg, png
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-lg font-medium transition-colors cursor-pointer"
                            disabled={uploading}
                        >
                            {uploading ? <Loader /> : "Pay Now"}
                        </button>
                        {success && <p className="text-green-500 text-center">{success}</p>}
                        {error && <p className="text-red-500 text-center">{error}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
};
