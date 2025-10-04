// Tokenomics Chart
function initTokenomicsChart() {
    const ctx = document.getElementById('tokenomicsChart');
    if (!ctx) return;
    
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Presale (ICO)', 'Liquidity & Listing', 'Community Rewards & Airdrops', 'Team & Advisors', 'Ecosystem Development Fund', 'Governance & DAO Fund'],
            datasets: [{
                data: [50, 30, 5, 5, 5, 5],
                backgroundColor: [
                    '#00ff88',
                    '#00d4ff',
                    '#8a2be2',
                    '#ff6b6b',
                    '#feca57',
                    '#ff9ff3'
                ],
                borderColor: '#1a1a1a',
                borderWidth: 2,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '50%',
            plugins: {
                legend: {
                    display: false
                }
            },
            onHover: (event, activeElements) => {
                // Get all allocation items
                const allocationItems = document.querySelectorAll('.allocation-item');
                
                if (activeElements.length > 0) {
                    const activeIndex = activeElements[0].index;
                    
                    // Reset all items to default style
                    allocationItems.forEach((item, index) => {
                        const label = item.querySelector('.allocation-label');
                        const percent = item.querySelector('.allocation-percent');
                        
                        if (index === activeIndex) {
                            // Highlight the active item
                            label.style.color = '#00ff88';
                            percent.style.color = '#00ff88';
                            item.style.transform = 'scale(1.05)';
                            item.style.transition = 'all 0.3s ease';
                        } else {
                            // Reset non-active items
                            label.style.color = '#ffffff';
                            percent.style.color = '#00ff88';
                            item.style.transform = 'scale(1)';
                            item.style.transition = 'all 0.3s ease';
                        }
                    });
                } else {
                    // Reset all items when not hovering
                    allocationItems.forEach((item) => {
                        const label = item.querySelector('.allocation-label');
                        const percent = item.querySelector('.allocation-percent');
                        
                        label.style.color = '#ffffff';
                        percent.style.color = '#00ff88';
                        item.style.transform = 'scale(1)';
                        item.style.transition = 'all 0.3s ease';
                    });
                }
            }
        }
    });
}

// Global wallet state
const walletState = {
    isConnected: false,
    provider: null,
    signer: null,
    address: null,
    shortAddress: null,
    chainId: null,
    isCorrectNetwork: false,
    web3Modal: null,
    ethereumProvider: null
};

// Presale configuration
const presaleConfig = {
    presaleAddress: '0x443c149de9CDDBE9DdD90E800caF6C0981d74444',
    usdtAddress: '0x55d398326f99059fF775485246999027B3197955', // USDT on BSC
    usdcAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC on BSC
    fourPerBNB: 250000, // 1 BNB = 250,000 FOUR
    fourPerUSDT: 214, // 1 USDT = 214 FOUR
    fourPerUSDC: 214, // 1 USDC = 214 FOUR
    minBNB: 0.1,
    minUSDT: 100,
    minUSDC: 100,
    bscChainId: 56, // BSC chain ID as number
    bscChainIdHex: '0x38', // BSC chain ID as hex
    bscChainName: 'BNB Smart Chain',
    bscRpcUrl: 'https://bsc-dataseed1.binance.org/',
    bscExplorerUrl: 'https://bscscan.com/',
    projectId: 'c4f79cc821944d9680842e34466bfb' // WalletConnect Project ID
};

// Initialize Web3Modal with WalletConnect v2
async function initWeb3Modal() {
    try {
        // Import Web3Modal dynamically
        const { EthereumProvider } = await import('https://unpkg.com/@walletconnect/ethereum-provider@2.11.0/dist/index.es.js');
        const { Web3Modal } = await import('https://unpkg.com/@web3modal/standalone@2.7.1/dist/index.es.js');
        
        // Create WalletConnect provider
        const ethereumProvider = await EthereumProvider.init({
            projectId: presaleConfig.projectId,
            chains: [presaleConfig.bscChainId],
            showQrModal: true,
            qrModalOptions: {
                themeMode: 'dark',
                themeVariables: {
                    '--wcm-font-family': 'JetBrains Mono, monospace',
                    '--wcm-accent-color': '#00ff88',
                    '--wcm-background-color': '#1a1a1a',
                    '--wcm-container-border-radius': '16px'
                }
            },
            metadata: {
                name: '$FOUR Token Presale',
                description: 'Official presale for $FOUR token on BSC',
                url: window.location.origin,
                icons: [window.location.origin + '/logo.png']
            }
        });

        // Create Web3Modal instance
        const web3Modal = new Web3Modal({
            projectId: presaleConfig.projectId,
            standaloneChains: [`eip155:${presaleConfig.bscChainId}`],
            themeMode: 'dark',
            themeVariables: {
                '--w3m-font-family': 'JetBrains Mono, monospace',
                '--w3m-accent-color': '#00ff88',
                '--w3m-background-color': '#1a1a1a',
                '--w3m-container-border-radius': '16px'
            }
        });

        walletState.web3Modal = web3Modal;
        walletState.ethereumProvider = ethereumProvider;

        // Set up event listeners
        ethereumProvider.on('accountsChanged', handleAccountsChanged);
        ethereumProvider.on('chainChanged', handleChainChanged);
        ethereumProvider.on('disconnect', handleDisconnect);

        console.log('Web3Modal initialized successfully');
        return { web3Modal, ethereumProvider };

    } catch (error) {
        console.error('Web3Modal initialization failed:', error);
        console.log('Falling back to MetaMask-only connection');
        return null;
    }
}

// Show network modal
function showNetworkModal() {
    const networkModal = document.getElementById('network-modal');
    if (networkModal) {
        networkModal.classList.add('show');
    }
}

// Hide network modal
function hideNetworkModal() {
    const networkModal = document.getElementById('network-modal');
    if (networkModal) {
        networkModal.classList.remove('show');
    }
}

// Handle account connection
async function handleAccountConnection(account) {
    try {
        walletState.isConnected = true;
        walletState.address = account.address;
        walletState.shortAddress = formatAddress(account.address);
        
        // Create provider from Web3Modal
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        walletState.provider = provider;
        walletState.signer = provider.getSigner();
        
        const network = await provider.getNetwork();
        walletState.chainId = network.chainId;
        walletState.isCorrectNetwork = network.chainId === presaleConfig.bscChainId;
        
        updateWalletUI();
        
        if (!walletState.isCorrectNetwork) {
            showNetworkModal();
        }
        
        showMessage('Wallet connected successfully!', 'success');
        
    } catch (error) {
        console.error('Account connection error:', error);
        showMessage('Failed to connect wallet', 'error');
    }
}

// Handle account disconnection
function handleAccountDisconnection() {
    walletState.isConnected = false;
    walletState.provider = null;
    walletState.signer = null;
    walletState.address = null;
    walletState.shortAddress = null;
    walletState.chainId = null;
    walletState.isCorrectNetwork = false;
    
    updateWalletUI();
    hideNetworkModal();
    showMessage('Wallet disconnected', 'info');
}

// Handle network change
async function handleNetworkChange(network) {
    try {
        walletState.chainId = network.chain?.id || null;
        walletState.isCorrectNetwork = walletState.chainId === presaleConfig.bscChainId;
        
        updateWalletUI();
        
        if (!walletState.isCorrectNetwork) {
            showNetworkModal();
            showMessage('Please switch to BSC network to continue.', 'warning');
        } else {
            hideNetworkModal();
            showMessage('Connected to BSC network!', 'success');
        }
        
    } catch (error) {
        console.error('Network change error:', error);
    }
}

// Main wallet connection function
async function connectWallet() {
    try {
        // Check if Web3Modal is available
        if (walletState.web3Modal && walletState.ethereumProvider) {
            // Use Web3Modal + WalletConnect
            await connectWithWeb3Modal();
        } else {
            // Fallback to MetaMask
            await connectMetaMaskFallback();
        }
    } catch (error) {
        console.error('Wallet connection error:', error);
        
        let errorMessage = 'Failed to connect wallet';
        if (error.message && error.message.includes('User rejected')) {
            errorMessage = 'Connection rejected by user';
        } else if (error.code === 4001) {
            errorMessage = 'Connection rejected by user';
        }
        
        showMessage(errorMessage, 'error');
    }
}

// Connect using Web3Modal + WalletConnect
async function connectWithWeb3Modal() {
    try {
        showMessage('Opening wallet selection...', 'info');
        
        // Open Web3Modal
        await walletState.web3Modal.openModal();
        
        // Enable the provider
        await walletState.ethereumProvider.enable();
        
        // Create ethers provider
        const ethersProvider = new ethers.providers.Web3Provider(walletState.ethereumProvider);
        const signer = ethersProvider.getSigner();
        const address = await signer.getAddress();
        const network = await ethersProvider.getNetwork();

        walletState.isConnected = true;
        walletState.provider = ethersProvider;
        walletState.signer = signer;
        walletState.address = address;
        walletState.shortAddress = formatAddress(address);
        walletState.chainId = network.chainId;
        walletState.isCorrectNetwork = network.chainId === presaleConfig.bscChainId;

        updateWalletUI();
        
        if (!walletState.isCorrectNetwork) {
            showNetworkModal();
        }

        showMessage('Wallet connected successfully!', 'success');
        
        // Close the modal
        walletState.web3Modal.closeModal();
        
    } catch (error) {
        console.error('Web3Modal connection error:', error);
        walletState.web3Modal.closeModal();
        throw error;
    }
}

// Fallback MetaMask connection (for when Web3Modal fails)
async function connectMetaMaskFallback() {
    if (typeof window.ethereum === 'undefined') {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                window.open('https://apps.apple.com/app/metamask/id1438144202', '_blank');
            } else {
                window.open('https://play.google.com/store/apps/details?id=io.metamask', '_blank');
            }
            throw new Error('MetaMask not installed. Please install MetaMask mobile app.');
        } else {
            const install = confirm('MetaMask is not installed. Click OK to install MetaMask extension.');
            if (install) {
                window.open('https://metamask.io/download/', '_blank');
            }
            throw new Error('MetaMask not installed. Please install MetaMask extension.');
        }
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = accounts[0];
    const network = await provider.getNetwork();

    walletState.isConnected = true;
    walletState.provider = provider;
    walletState.signer = signer;
    walletState.address = address;
    walletState.shortAddress = formatAddress(address);
    walletState.chainId = network.chainId;
    walletState.isCorrectNetwork = network.chainId === presaleConfig.bscChainId;

    updateWalletUI();
    
    if (!walletState.isCorrectNetwork) {
        showNetworkModal();
    }

    setupWalletEventListeners();
    showMessage('Wallet connected successfully!', 'success');
}

// Setup wallet event listeners (for MetaMask fallback)
function setupWalletEventListeners() {
    if (window.ethereum) {
        // Remove existing listeners
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
        window.ethereum.removeAllListeners('disconnect');
        
        // Add new listeners
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
        window.ethereum.on('disconnect', handleDisconnect);
    }
}

// Handle account changes
function handleAccountsChanged(accounts) {
    console.log('Accounts changed:', accounts);
    
    if (accounts.length === 0) {
        handleAccountDisconnection();
    } else if (walletState.isConnected && accounts[0] !== walletState.address) {
        walletState.address = accounts[0];
        walletState.shortAddress = formatAddress(accounts[0]);
        updateWalletUI();
        showMessage('Account switched successfully!', 'info');
    }
}

// Handle chain changes
async function handleChainChanged(chainId) {
    console.log('Chain changed to:', chainId);
    
    if (walletState.isConnected) {
        try {
            const numericChainId = parseInt(chainId, 16);
            walletState.chainId = numericChainId;
            walletState.isCorrectNetwork = numericChainId === presaleConfig.bscChainId;
            
            updateWalletUI();
            
            if (!walletState.isCorrectNetwork) {
                showNetworkModal();
                showMessage('Please switch to BSC network to continue.', 'warning');
            } else {
                hideNetworkModal();
                showMessage('Connected to BSC network!', 'success');
            }
            
        } catch (error) {
            console.error('Error handling chain change:', error);
        }
    }
}

// Handle disconnect
function handleDisconnect() {
    console.log('Wallet disconnected');
    handleAccountDisconnection();
}

// Disconnect wallet
async function disconnectWallet() {
    try {
        if (walletState.ethereumProvider) {
            await walletState.ethereumProvider.disconnect();
        }
        
        if (walletState.web3Modal) {
            walletState.web3Modal.closeModal();
        }
        
        handleAccountDisconnection();
        
    } catch (error) {
        console.error('Disconnect error:', error);
        // Force disconnect
        handleAccountDisconnection();
    }
}

// Update wallet UI elements
function updateWalletUI() {
    // Update all wallet buttons
    const connectButtons = document.querySelectorAll('.connect-wallet-btn, .js-connect-wallet');
    connectButtons.forEach(button => {
        if (walletState.isConnected) {
            button.textContent = walletState.shortAddress || 'Connected';
            button.style.background = '#00ff88';
            button.style.color = 'var(--bg-primary)';
        } else {
            button.textContent = 'Connect Wallet';
            button.style.background = 'var(--gradient-primary)';
            button.style.color = 'var(--bg-primary)';
        }
    });
    
    // Update presale UI
    const presaleConnectBtn = document.getElementById('connect-wallet-presale-btn');
    const presaleBuyBtn = document.getElementById('buy-btn');
    const walletInfo = document.getElementById('wallet-info');
    const connectionStatus = document.getElementById('connection-status');
    const walletAddressEl = document.getElementById('wallet-address');
    const networkNameEl = document.getElementById('network-name');
    
    if (presaleConnectBtn && presaleBuyBtn && walletInfo) {
        if (walletState.isConnected) {
            presaleConnectBtn.style.display = 'none';
            presaleBuyBtn.style.display = 'block';
            walletInfo.style.display = 'block';
            
            if (connectionStatus) {
                connectionStatus.textContent = 'Connected';
                connectionStatus.className = 'status-connected';
            }
            
            if (walletAddressEl) {
                walletAddressEl.textContent = walletState.shortAddress || '';
            }
            
            if (networkNameEl) {
                if (walletState.isCorrectNetwork) {
                    networkNameEl.textContent = presaleConfig.bscChainName;
                    networkNameEl.style.color = 'var(--neon-green)';
                } else {
                    networkNameEl.textContent = 'Wrong Network';
                    networkNameEl.style.color = '#ff6b6b';
                }
            }
            
            // Enable/disable buy button based on network
            presaleBuyBtn.disabled = !walletState.isCorrectNetwork;
            
        } else {
            presaleConnectBtn.style.display = 'block';
            presaleBuyBtn.style.display = 'none';
            walletInfo.style.display = 'none';
            
            if (connectionStatus) {
                connectionStatus.textContent = 'Not Connected';
                connectionStatus.className = 'status-disconnected';
            }
            
            if (walletAddressEl) {
                walletAddressEl.textContent = '';
            }
            
            if (networkNameEl) {
                networkNameEl.textContent = 'Not Connected';
                networkNameEl.style.color = 'var(--text-muted)';
            }
        }
    }
}

// Switch to BSC network
async function switchToBSC() {
    try {
        showMessage('Switching to BSC network...', 'info');
        
        if (walletState.ethereumProvider) {
            // Use WalletConnect provider
            await walletState.ethereumProvider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: presaleConfig.bscChainIdHex }]
            });
        } else if (window.ethereum) {
            // Use MetaMask
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: presaleConfig.bscChainIdHex }]
            });
        }
        
        hideNetworkModal();
        showMessage('Successfully switched to BSC!', 'success');
        
    } catch (error) {
        console.error('Network switch error:', error);
        
        if (error.code === 4902) {
            // Chain not added, try to add it
            try {
                const addChainParams = {
                    chainId: presaleConfig.bscChainIdHex,
                    chainName: presaleConfig.bscChainName,
                    rpcUrls: [presaleConfig.bscRpcUrl],
                    nativeCurrency: {
                        name: 'BNB',
                        symbol: 'BNB',
                        decimals: 18
                    },
                    blockExplorerUrls: [presaleConfig.bscExplorerUrl]
                };

                if (walletState.ethereumProvider) {
                    await walletState.ethereumProvider.request({
                        method: 'wallet_addEthereumChain',
                        params: [addChainParams]
                    });
                } else if (window.ethereum) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [addChainParams]
                    });
                }
                
                hideNetworkModal();
                showMessage('BSC network added and switched successfully!', 'success');
                
            } catch (addError) {
                console.error('Add network error:', addError);
                showMessage('Failed to add BSC network. Please add it manually.', 'error');
            }
        } else if (error.code === 4001) {
            showMessage('Network switch cancelled by user.', 'warning');
        } else {
            showMessage('Failed to switch network. Please try again.', 'error');
        }
    }
}

// Calculate receive amount
function calculateReceiveAmount() {
    const payAmountInput = document.getElementById('pay-amount');
    const receiveAmountInput = document.getElementById('receive-amount');
    const currentCurrency = document.querySelector('.currency-tab.active')?.dataset.currency || 'BNB';
    
    if (!payAmountInput || !receiveAmountInput) return;
    
    const payAmount = parseFloat(payAmountInput.value);
    if (isNaN(payAmount) || payAmount <= 0) {
        receiveAmountInput.value = '0.0';
        return;
    }

    let fourAmount = 0;
    if (currentCurrency === 'BNB') {
        fourAmount = payAmount * presaleConfig.fourPerBNB;
    } else if (currentCurrency === 'USDT') {
        fourAmount = payAmount * presaleConfig.fourPerUSDT;
    } else if (currentCurrency === 'USDC') {
        fourAmount = payAmount * presaleConfig.fourPerUSDC;
    }

    receiveAmountInput.value = fourAmount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Handle buy transaction
async function handleBuyTransaction() {
    const payAmountInput = document.getElementById('pay-amount');
    const currentCurrency = document.querySelector('.currency-tab.active')?.dataset.currency || 'BNB';
    const buyBtn = document.getElementById('buy-btn');
    
    if (!payAmountInput || !buyBtn) return;
    
    const payAmount = payAmountInput.value.trim();
    
    // Validate input
    if (!payAmount || isNaN(parseFloat(payAmount)) || parseFloat(payAmount) <= 0) {
        showMessage('Please enter a valid amount greater than 0.', 'error');
        return;
    }
    
    // Check wallet connection
    if (!walletState.isConnected) {
        showMessage('Please connect your wallet first.', 'error');
        return;
    }
    
    // Check network
    if (!walletState.isCorrectNetwork) {
        showMessage('Please switch to BSC network first.', 'error');
        showNetworkModal();
        return;
    }
    
    // Check provider and signer
    if (!walletState.provider || !walletState.signer) {
        showMessage('Wallet not properly connected. Please reconnect.', 'error');
        return;
    }
    
    buyBtn.disabled = true;
    showMessage('Preparing transaction...', 'info');
    
    try {
        let tx;
        const amount = parseFloat(payAmount);
        const minRequired = currentCurrency === 'BNB'
            ? presaleConfig.minBNB
            : currentCurrency === 'USDT'
                ? presaleConfig.minUSDT
                : presaleConfig.minUSDC;
        
        if (amount < minRequired) {
            openMinAmountModal(currentCurrency, minRequired);
            return;
        }
        
        if (currentCurrency === 'BNB') {
            // Send BNB directly
            const value = ethers.utils.parseEther(amount.toString());
            
            tx = await walletState.signer.sendTransaction({
                to: presaleConfig.presaleAddress,
                value: value,
                gasLimit: 21000
            });
            
            showMessage('Transaction sent! Waiting for confirmation...', 'info');
            
        } else {
            // Handle USDT/USDC tokens
            const tokenAddress = currentCurrency === 'USDT' ? presaleConfig.usdtAddress : presaleConfig.usdcAddress;
            
            const tokenABI = [
                "function transfer(address to, uint256 amount) returns (bool)",
                "function balanceOf(address owner) view returns (uint256)",
                "function decimals() view returns (uint8)"
            ];
            
            const tokenContract = new ethers.Contract(tokenAddress, tokenABI, walletState.signer);
            
            // Get token decimals
            const decimals = await tokenContract.decimals();
            const tokenAmount = ethers.utils.parseUnits(amount.toString(), decimals);
            
            // Check balance
            const balance = await tokenContract.balanceOf(walletState.address);
            if (balance.lt(tokenAmount)) {
                throw new Error(`Insufficient ${currentCurrency} balance`);
            }
            
            showMessage(`Sending ${currentCurrency} tokens...`, 'info');
            
            // Send tokens
            tx = await tokenContract.transfer(presaleConfig.presaleAddress, tokenAmount);
            
            showMessage('Transaction sent! Waiting for confirmation...', 'info');
        }
        
        // Wait for confirmation
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            showMessage('🎉 Purchase successful! Tokens will be airdropped after presale ends.', 'success');
            
            // Reset form
            payAmountInput.value = '';
            const receiveAmountInput = document.getElementById('receive-amount');
            if (receiveAmountInput) {
                receiveAmountInput.value = '0.0';
            }
            
        } else {
            throw new Error('Transaction failed');
        }
        
    } catch (error) {
        console.error('Transaction error:', error);
        
        let errorMessage = 'Transaction failed';
        
        if (error.code === 4001) {
            errorMessage = 'Transaction cancelled by user';
        } else if (error.message.includes('insufficient funds')) {
            errorMessage = 'Insufficient funds for transaction';
        } else if (error.message.includes('Insufficient')) {
            errorMessage = error.message;
        } else if (error.reason) {
            errorMessage = error.reason;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showMessage(errorMessage, 'error');
        
    } finally {
        buyBtn.disabled = false;
    }
}

// Initialize presale functionality
function initPresale() {
    // Get UI elements
    const connectBtn = document.getElementById('connect-wallet-presale-btn');
    const buyBtn = document.getElementById('buy-btn');
    const payAmountInput = document.getElementById('pay-amount');
    const currencyTabs = document.querySelectorAll('.currency-tab');
    const payCurrencyEl = document.getElementById('pay-currency');
    const networkModal = document.getElementById('network-modal');
    const modalSwitchBtn = document.getElementById('modal-switch-network-btn');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    
    // Event listeners
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }
    
    if (buyBtn) {
        buyBtn.addEventListener('click', handleBuyTransaction);
    }
    
    if (payAmountInput) {
        payAmountInput.addEventListener('input', calculateReceiveAmount);
    }
    
    if (currencyTabs) {
        currencyTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                currencyTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                if (payCurrencyEl) {
                    payCurrencyEl.textContent = tab.dataset.currency;
                }
                
                calculateReceiveAmount();
            });
        });
    }
    
    if (modalSwitchBtn) {
        modalSwitchBtn.addEventListener('click', switchToBSC);
    }
    
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', hideNetworkModal);
    }
    
    if (networkModal) {
        networkModal.addEventListener('click', (e) => {
            if (e.target === networkModal) {
                hideNetworkModal();
            }
        });
    }
    
    // Initialize UI
    updateWalletUI();
}

// Initialize wallet connection for header buttons
function initWalletConnection() {
    const connectButtons = document.querySelectorAll('.connect-wallet-btn, .js-connect-wallet');
    
    connectButtons.forEach(button => {
        button.addEventListener('click', async () => {
            if (walletState.isConnected) {
                await disconnectWallet();
            } else {
                await connectWallet();
            }
        });
    });
}

// Helper function to format address
function formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Helper function to show messages
function showMessage(message, type = 'info') {
    const messageEl = document.getElementById('presale-message');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `presale-message message-${type}`;
        
        // Clear message after 5 seconds
        setTimeout(() => {
            messageEl.textContent = '';
            messageEl.className = 'presale-message';
        }, 5000);
    }
}

// Smooth Scrolling
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Progress Bar Animation
function initProgressAnimation() {
    const progressFill = document.querySelector('.progress-fill');
    const progressPercentage = document.querySelector('.progress-percentage');
    
    if (!progressFill || !progressPercentage) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                progressFill.style.width = '62.5%';
                let progress = 0;
                const target = 62.5;
                const timer = setInterval(() => {
                    progress += 1;
                    progressPercentage.textContent = `${progress}%`;
                    if (progress >= target) {
                        clearInterval(timer);
                    }
                }, 30);
            }
        });
    });
    
    observer.observe(progressFill);
}

// FAQ Toggle
function initFAQToggle() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            const isOpen = answer.style.display === 'block';
            answer.style.display = isOpen ? 'none' : 'block';
        });
        
        // Initially hide answers
        answer.style.display = 'none';
    });
}

// Logo Scroller Animation
function initLogoScroller() {
    const scrollers = document.querySelectorAll(".logo-scroller");

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        addAnimation();
    }

    function addAnimation() {
        scrollers.forEach((scroller) => {
            scroller.setAttribute("data-animated", true);

            const scrollerInner = scroller.querySelector(".scroller-inner");
            const scrollerContent = Array.from(scrollerInner.children);

            scrollerContent.forEach((item) => {
                const duplicatedItem = item.cloneNode(true);
                duplicatedItem.setAttribute("aria-hidden", true);
                scrollerInner.appendChild(duplicatedItem);
            });
        });
    }
}

// Mobile Menu Toggle
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navContainer = document.querySelector('.nav-container');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            navContainer.classList.toggle('menu-active');
            menuToggle.classList.toggle('active');
        });
    }
}

// Countdown Timer Function
function initCountdownTimer() {
    // Target date: October 5, 2025 at 15:00 PM Beijing time (UTC+8)
    const targetDate = new Date('2025-10-05T15:00:00+08:00');
    
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
        console.log('Countdown elements not found');
        return;
    }
    
    function updateCountdown() {
        const now = new Date();
        const timeDiff = targetDate - now;
        
        if (timeDiff > 0) {
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            
            daysEl.textContent = days.toString().padStart(2, '0');
            hoursEl.textContent = hours.toString().padStart(2, '0');
            minutesEl.textContent = minutes.toString().padStart(2, '0');
            secondsEl.textContent = seconds.toString().padStart(2, '0');
        } else {
            // Countdown has ended
            daysEl.textContent = '00';
            hoursEl.textContent = '00';
            minutesEl.textContent = '00';
            secondsEl.textContent = '00';
            
            // Optional: Add expired message
            const countdownTimer = document.querySelector('.countdown-timer');
            if (countdownTimer && !countdownTimer.classList.contains('expired')) {
                countdownTimer.classList.add('expired');
                const expiredMsg = document.createElement('div');
                expiredMsg.className = 'countdown-expired';
                expiredMsg.textContent = 'Presale Ended';
                expiredMsg.style.color = 'var(--text-muted)';
                expiredMsg.style.fontWeight = '600';
                expiredMsg.style.marginTop = '1rem';
                countdownTimer.parentNode.appendChild(expiredMsg);
            }
        }
    }
    
    // Update immediately and then every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Help Modals Function
function initHelpModals() {
    const howToBuyBtn = document.getElementById('how-to-buy-btn');
    const connectionHelpBtn = document.getElementById('connection-help-btn');
    const howToBuyModal = document.getElementById('how-to-buy-modal');
    const connectionHelpModal = document.getElementById('connection-help-modal');
    const copyAddressBtn = document.getElementById('copy-address-btn');
    const presaleAddressInput = document.getElementById('presale-address');
    
    // Generate QR code when connection help modal is opened
    function generateQRCode() {
        const qrCodeContainer = document.getElementById('qr-code');
        const presaleAddress = presaleAddressInput.value;
        
        if (qrCodeContainer && presaleAddress) {
            // Clear existing QR code
            qrCodeContainer.innerHTML = '';
            
            // Generate QR code using QR.js library from CDN
            const qrCode = new QRCode(qrCodeContainer, {
                text: presaleAddress,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        }
    }
    
    if (howToBuyBtn && howToBuyModal) {
        howToBuyBtn.addEventListener('click', () => {
            howToBuyModal.classList.add('show');
        });
        
        // Close modal when clicking close button, outside modal, or close action button
        howToBuyModal.addEventListener('click', (e) => {
            if (e.target === howToBuyModal || e.target.classList.contains('modal-close-btn') || e.target.classList.contains('modal-close-action')) {
                howToBuyModal.classList.remove('show');
            }
        });
    }
    
    if (connectionHelpBtn && connectionHelpModal) {
        connectionHelpBtn.addEventListener('click', () => {
            connectionHelpModal.classList.add('show');
            // Generate QR code when modal opens
            setTimeout(generateQRCode, 100); // Small delay to ensure DOM is ready
        });
        
        // Close modal when clicking close button, outside modal, or close action button
        connectionHelpModal.addEventListener('click', (e) => {
            if (e.target === connectionHelpModal || e.target.classList.contains('modal-close-btn') || e.target.classList.contains('modal-close-action')) {
                connectionHelpModal.classList.remove('show');
            }
        });
    }
    
    // Copy address functionality
    if (copyAddressBtn && presaleAddressInput) {
        copyAddressBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(presaleAddressInput.value);
                copyAddressBtn.textContent = '✅ Copied!';
                copyAddressBtn.classList.add('copied');
                
                setTimeout(() => {
                    copyAddressBtn.textContent = '📋 Copy Address';
                    copyAddressBtn.classList.remove('copied');
                }, 2000);
            } catch (err) {
                // Fallback for older browsers
                presaleAddressInput.select();
                document.execCommand('copy');
                copyAddressBtn.textContent = '✅ Copied!';
                copyAddressBtn.classList.add('copied');
                
                setTimeout(() => {
                    copyAddressBtn.textContent = '📋 Copy Address';
                    copyAddressBtn.classList.remove('copied');
                }, 2000);
            }
        });
    }
}

// Dynamic navigation links based on existing sections
function initNavLinks() {
    const navLinksContainer = document.querySelector('.nav-links');
    if (!navLinksContainer) return;

    // Simplified static navigation links
    navLinksContainer.innerHTML = '';
    const navItems = [
        { id: 'presale', text: 'Presale' },
        { id: 'about', text: 'What is $FOUR' },
        { id: 'tokenomics', text: 'Tokenomics' },
        { id: 'roadmap', text: 'Roadmap' },
        { id: 'faq', text: 'FAQ' }
    ];
    navItems.forEach(item => {
        const link = document.createElement('a');
        link.href = `#${item.id}`;
        link.textContent = item.text;
        navLinksContainer.appendChild(link);
    });
}

// Initialize all components
document.addEventListener('DOMContentLoaded', async () => {
    // Check if required libraries are loaded
    if (typeof ethers === 'undefined') {
        console.error('Ethers.js not loaded');
        return;
    }
    
    // Initialize Web3Modal
    await initWeb3Modal();
    
    // Initialize components
    initTokenomicsChart();
    initNavLinks();
    initWalletConnection();
    initPresale();
    initSmoothScrolling();
    initProgressAnimation();
    initFAQToggle();
    initLogoScroller();
    initMobileMenu();
    initCountdownTimer();
    initHelpModals();
    initMinAmountModal();
    
    console.log('All components initialized successfully');
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Mobile menu toggle (if needed)
function toggleMobileMenu() {
    // Implementation for mobile menu toggle
    console.log('Mobile menu toggle');
}

function openMinAmountModal(currency, min){
    const m=document.getElementById('min-amount-modal');
    const t=document.getElementById('min-modal-text');
    if(t)t.textContent=`Please enter at least ${min} ${currency} to continue.`;
    if(m)m.classList.add('show');
}

function initMinAmountModal(){
    const m=document.getElementById('min-amount-modal');
    if(!m)return;
    m.addEventListener('click',e=>{if(e.target===m||e.target.classList.contains('modal-close-btn')||e.target.classList.contains('modal-close-action'))m.classList.remove('show');});
}
