export const mockNotices = [
    {
        id: '1',
        title: 'Manutenção do Elevador Social',
        description: 'O elevador social do bloco A estará em manutenção preventiva nesta sexta-feira das 08:00 às 12:00.',
        date: '15/03/2026',
        type: 'danger',
    },
    {
        id: '2',
        title: 'Assembleia Geral Ordinária',
        description: 'Convocamos todos os moradores para a AGO anual que ocorrerá no salão de festas no dia 20/03.',
        date: '20/03/2026',
        type: 'info',
    },
    {
        id: '3',
        title: 'Limpeza da Caixa D\'água',
        description: 'Falta de água programada para a próxima terça-feira (10/03) no período da tarde.',
        date: '10/03/2026',
        type: 'warning',
    }
];

export const mockCharges = [
    {
        id: '1',
        unit: 'Apt 101',
        resident: 'João Silva',
        amount: 850.00,
        dueDate: '10/03/2026',
        status: 'paid', // paid, pending, late
        is_private: false,
    },
    {
        id: '2',
        unit: 'Apt 102',
        resident: 'Maria Oliveira',
        amount: 850.00,
        dueDate: '10/03/2026',
        status: 'pending',
        is_private: true,
    },
    {
        id: '3',
        unit: 'Apt 201',
        resident: 'Carlos Pereira',
        amount: 850.00,
        dueDate: '10/02/2026',
        status: 'late',
        is_private: true,
    },
    {
        id: '4',
        unit: 'Apt 305',
        resident: 'Ana Rodrigues',
        amount: 850.00,
        dueDate: '10/03/2026',
        status: 'paid',
        is_private: false,
    }
];

export const mockOverview = {
    totalResidents: 124,
    occupancyRate: '92%',
    activeNotices: 3,
    monthlyRevenue: 'R$ 95.400,00',
    defaultRate: '4.5%', // Inadimplência
};

// --- NOVOS DADOS DE TRANSPARÊNCIA FINANCEIRA ---

export const mockFinancials = {
    balance: {
        current: 125000.50, // Saldo em caixa
        status: 'positive', // positive, negative
    },
    funds: [
        { id: 1, name: 'Fundo de Reserva', amount: 45000.00, target: 50000.00, color: 'emerald' },
        { id: 2, name: 'Fundo de Obras (Fachada)', amount: 25000.00, target: 100000.00, color: 'blue' },
        { id: 3, name: 'Fundo Trabalhista', amount: 30000.00, target: 30000.00, color: 'purple' },
    ],
    feeBreakdown: [ // Composição da Taxa de Condomínio (Ex: R$ 850,00)
        { id: 1, category: 'Despesas Ordinárias (Água, Luz, Limpeza)', amount: 450.00, percentage: 53 },
        { id: 2, category: 'Folha de Pagamento', amount: 250.00, percentage: 29 },
        { id: 3, category: 'Fundo de Reserva (10%)', amount: 85.00, percentage: 10 },
        { id: 4, category: 'Fundo de Obras', amount: 65.00, percentage: 8 },
    ]
};
