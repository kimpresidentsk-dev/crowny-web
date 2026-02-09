// Global State
let userCredits = 0;
let crownyBalance = 10000;
let maticBalance = 100;
let walletConnected = false;
let walletAddress = '';
let currentOrderType = 'buy';
let currentPrice = 0.0235;
let web3;

let nfts = [
    { id: 1, name: 'Golden Sunset', price: 2.5, emoji: '🌅', owned: false },
    { id: 2, name: 'Abstract Dreams', price: 1.8, emoji: '🎨', owned: false },
    { id: 3, name: 'Digital Flower', price: 3.2, emoji: '🌸', owned: false }
];

// Navigation - FIXED
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
        if (sectionId === 'art') renderNFTs();
    }
    window.scrollTo(0, 0);
}

// Blockchain Wallet
async function connectWallet() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            walletAddress = accounts[0];
            
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x89' }],
            }).catch(async (err) => {
                if (err.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x89',
                            chainName: 'Polygon',
                            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                            rpcUrls: ['https://polygon-rpc.com'],
                            blockExplorerUrls: ['https://polygonscan.com/']
                        }]
                    });
                }
            });
            
            web3 = new Web3(window.ethereum);
            const balance = await web3.eth.getBalance(walletAddress);
            maticBalance = parseFloat(web3.utils.fromWei(balance, 'ether'));
            
            walletConnected = true;
            updateWalletUI();
            alert('Connected to Polygon!');
            
            window.ethereum.on('accountsChanged', (accs) => {
                if (accs.length === 0) {
                    walletConnected = false;
                    updateWalletUI();
                } else {
                    walletAddress = accs[0];
                    updateWalletUI();
                }
            });
        } else {
            simulateWallet();
        }
    } catch (error) {
        console.error(error);
        simulateWallet();
    }
}

function simulateWallet() {
    walletAddress = '0x' + Math.random().toString(36).substr(2, 40);
    walletConnected = true;
    updateWalletUI();
    alert('Simulation Mode\nInstall MetaMask for real blockchain!');
}

function updateWalletUI() {
    document.getElementById('wallet-status').style.display = walletConnected ? 'none' : 'block';
    document.getElementById('wallet-info').style.display = walletConnected ? 'block' : 'none';
    if (walletConnected) {
        document.getElementById('wallet-address').textContent = 
            walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
        document.getElementById('wallet-balance').textContent = crownyBalance;
    }
}

// Credit
function buyProduct(reward) {
    if (!walletConnected) {
        alert('Connect wallet first!');
        showSection('wallet');
        return;
    }
    userCredits += reward;
    crownyBalance += reward;
    document.getElementById('user-credits').textContent = userCredits;
    document.getElementById('wallet-balance').textContent = crownyBalance;
    alert(`+${reward} CROWNY added!`);
}

// Trading
function selectPair(name, price) {
    currentPrice = price;
    document.getElementById('current-price').textContent = price;
    document.querySelectorAll('.pair-card').forEach(c => c.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function setOrderType(type) {
    currentOrderType = type;
    const buy = document.querySelector('.order-type .btn-buy');
    const sell = document.querySelector('.order-type .btn-sell');
    if (type === 'buy') {
        buy.classList.add('active');
        sell.classList.remove('active');
    } else {
        sell.classList.add('active');
        buy.classList.remove('active');
    }
}

function executeTrade() {
    if (!walletConnected) {
        alert('Connect wallet!');
        showSection('wallet');
        return;
    }
    
    const amt = parseFloat(document.getElementById('trade-amount').value);
    if (!amt || amt <= 0) {
        alert('Invalid amount');
        return;
    }
    
    const cost = amt * currentPrice;
    
    if (currentOrderType === 'buy') {
        if (cost > maticBalance) {
            alert('Insufficient MATIC!');
            return;
        }
        maticBalance -= cost;
        crownyBalance += amt;
        alert(`Bought ${amt} CROWNY`);
    } else {
        if (amt > crownyBalance) {
            alert('Insufficient CROWNY!');
            return;
        }
        crownyBalance -= amt;
        maticBalance += cost;
        alert(`Sold ${amt} CROWNY`);
    }
    
    document.getElementById('crowny-balance').textContent = crownyBalance.toFixed(2);
    document.getElementById('matic-balance').textContent = maticBalance.toFixed(4);
    document.getElementById('trade-amount').value = '';
}

// NFT
function showMintForm() {
    const form = document.getElementById('mint-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function mintNFT() {
    if (!walletConnected) {
        alert('Connect wallet!');
        return;
    }
    
    const name = document.getElementById('nft-name').value;
    const desc = document.getElementById('nft-description').value;
    const price = parseFloat(document.getElementById('nft-price').value);
    
    if (!name || !desc || !price) {
        alert('Fill all fields');
        return;
    }
    
    const emojis = ['🎨', '🖼️', '🌅', '🌸', '🦋', '✨', '💎', '🌟'];
    nfts.unshift({
        id: Date.now(),
        name, price,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        description: desc,
        owned: true,
        owner: walletAddress
    });
    
    renderNFTs();
    document.getElementById('nft-name').value = '';
    document.getElementById('nft-description').value = '';
    document.getElementById('nft-price').value = '';
    document.getElementById('mint-form').style.display = 'none';
    alert('NFT minted!');
}

function buyNFT(id) {
    if (!walletConnected) {
        alert('Connect wallet!');
        return;
    }
    
    const nft = nfts.find(n => n.id === id);
    if (!nft) return;
    
    if (nft.price > maticBalance) {
        alert('Insufficient MATIC!');
        return;
    }
    
    if (confirm(`Buy "${nft.name}" for ${nft.price} MATIC?`)) {
        maticBalance -= nft.price;
        nft.owned = true;
        nft.owner = walletAddress;
        document.getElementById('matic-balance').textContent = maticBalance.toFixed(4);
        renderNFTs();
        alert('NFT purchased!');
    }
}

function sellNFT(id) {
    const nft = nfts.find(n => n.id === id);
    if (!nft) return;
    
    if (confirm(`List "${nft.name}" for sale?`)) {
        nft.owned = false;
        nft.owner = null;
        renderNFTs();
        alert('NFT listed!');
    }
}

function renderNFTs() {
    const grid = document.getElementById('nft-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    nfts.forEach(nft => {
        const isOwned = nft.owned && nft.owner === walletAddress;
        const card = document.createElement('div');
        card.className = 'nft-card';
        card.innerHTML = `
            <div class="nft-image">${nft.emoji}</div>
            <div class="nft-info">
                <h3>${nft.name}</h3>
                ${nft.description ? `<p style="font-size:0.9rem;color:var(--accent);margin:0.5rem 0;">${nft.description}</p>` : ''}
                <p class="nft-price">${nft.price} MATIC</p>
                <button onclick="${isOwned ? 'sellNFT' : 'buyNFT'}(${nft.id})" class="btn-buy" style="width:100%;${isOwned ? 'background:var(--gold);' : ''}">
                    ${isOwned ? 'List for Sale' : 'Buy Now'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('user-credits').textContent = userCredits;
    document.getElementById('crowny-balance').textContent = crownyBalance;
    document.getElementById('matic-balance').textContent = maticBalance.toFixed(4);
    document.getElementById('current-price').textContent = currentPrice;
    
    const tradeInput = document.getElementById('trade-amount');
    if (tradeInput) {
        tradeInput.addEventListener('input', function() {
            const total = (parseFloat(this.value) || 0) * currentPrice;
            document.getElementById('trade-total').textContent = total.toFixed(6);
        });
    }
    
    showSection('home');
    console.log(typeof window.ethereum !== 'undefined' ? 'MetaMask OK' : 'Simulation mode');
});
