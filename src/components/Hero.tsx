import { motion } from "framer-motion";
import { ShieldCheck, ScanLine, Search } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black px-4 py-20 sm:px-6 lg:px-8 flex flex-col">
      {/* Cabeçalho institucional */}
      <div className="w-full text-center mb-12">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">
          Instituto Federal do Maranhão — IFMA Campus Imperatriz
        </p>
        <p className="text-xs text-white/30 tracking-wider">
          Ciência da Computação · Trabalho de Conclusão de Curso · 2026
        </p>
      </div>

      {/* Conteúdo principal */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mx-auto max-w-4xl text-center flex-1 flex flex-col justify-center"
      >
        {/* Ícone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
              <ShieldCheck className="w-9 h-9 text-white" strokeWidth={1.5} />
            </div>
            <motion.div
              className="absolute inset-0 rounded-full border border-white/10"
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-4"
        >
          DETECTOR DE
          <br />
          <span className="text-white/70">ALÉRGENOS</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-white/50 text-sm sm:text-base max-w-xl mx-auto mb-2 leading-relaxed"
        >
          Sistema de detecção de alérgenos em produtos alimentícios por leitura
          de código de barras, integrado à base colaborativa Open Food Facts.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-white/30 text-xs max-w-md mx-auto mb-10"
        >
          Carlos Sérgio Silva Gontijo · Orientador: Prof. Me. Daniel Duarte Costa
        </motion.p>

        {/* Botões */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <a
            href="#scanner"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            <ScanLine className="w-4 h-4" />
            Escanear código de barras
          </a>
          <a
            href="#busca"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 text-white px-6 py-3 text-sm font-medium hover:bg-white/5 transition-colors"
          >
            <Search className="w-4 h-4" />
            Buscar por nome
          </a>
        </motion.div>

        {/* Estatísticas */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="grid grid-cols-3 gap-4 mt-16 max-w-lg mx-auto"
        >
          {[
            { value: "4M+", label: "Produtos cadastrados" },
            { value: "150+", label: "Países cobertos" },
            { value: "3", label: "Camadas de análise" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-white text-xl font-bold">{stat.value}</p>
              <p className="text-white/30 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* LGPD */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="text-center mt-auto pt-8"
      >
        <p className="text-white/20 text-xs">
          🔒 Preferências processadas exclusivamente no seu dispositivo — em conformidade com a LGPD (Lei n.º 13.709/2018)
        </p>
      </motion.div>
    </section>
  );
};
