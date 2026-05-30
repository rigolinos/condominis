import { LoginSignupContainer } from './LoginSignupContainer'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const { message } = await searchParams

    return (
        <div className="min-h-screen w-full flex bg-[#030712] text-white selection:bg-blue-500/30 overflow-hidden relative">
            {/* Background Decorators */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen pointer-events-none animate-pulse-slow object-cover" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] mix-blend-screen pointer-events-none animate-pulse-slow object-cover" style={{ animationDelay: '2s' }} />

            {/* Left Column (Brand/Visuals) */}
            <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative z-10">
                <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <p className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        Condominis
                    </p>
                </div>

                <div className="flex flex-col gap-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <h1 className="text-5xl xl:text-6xl font-medium leading-[1.1] tracking-tight">
                        Gestão inteligente<br />
                        <span className="text-gray-400">para o seu condomínio.</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-md font-light">
                        Simplificando a vida de síndicos, moradores e porteiros com tecnologia de ponta e design intuitivo.
                    </p>
                </div>

                <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                    <div className="flex -space-x-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={`w-10 h-10 rounded-full border-2 border-[#030712] bg-gray-800 flex items-center justify-center relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20" />
                                <span className="text-xs text-gray-400">M</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-sm font-medium text-gray-400">
                        Junte-se a <span className="text-white">centenas</span> de condomínios
                    </p>
                </div>
            </div>

            {/* Right Column (Form) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative z-10">
                <LoginSignupContainer message={message} />
            </div>
        </div>
    )
}
