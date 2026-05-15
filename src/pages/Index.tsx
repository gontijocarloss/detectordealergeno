import { Hero } from "@/components/Hero";
import { motion } from "framer-motion";
import AllergenScanner from "@/components/AllergenScanner";
import AllergenFreeSearch from "@/components/AllergenFreeSearch";
import { ShieldAlert } from "lucide-react";

const Footer = () => (
  <footer className="w-full border-t border-border mt-16 py-8 px-4">
    <div className="max-w-4xl mx-auto text-center space-y-2">
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <ShieldAlert className="w-4 h-4" />
        <p className="text-xs font-medium">Aviso de Responsabilidade</p>
      </div>
      <p className="text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed">
        Este sistema é um protótipo acadêmico desenvolvido como Trabalho de Conclusão de Curso.
        As informações são obtidas da base colaborativa Open Food Facts e podem estar incompletas.
        Sempre verifique a embalagem original do produto antes do consumo.
      </p>
      <div className="pt-3 space-y-1">
        <p className="text-xs text-muted-foreground/60">
          <strong>Desenvolvido por:</strong> Carlos Sérgio Silva Gontijo
        </p>
        <p className="text-xs text-muted-foreground/60">
          <strong>Orientador:</strong> Prof. Me. Daniel Duarte Costa
        </p>
        <p className="text-xs text-muted-foreground/60">
          Instituto Federal de Educação, Ciência e Tecnologia do Maranhão — IFMA Campus Imperatriz
        </p>
        <p className="text-xs text-muted-foreground/40">
          Ciência da Computação · 2026
        </p>
      </div>
    </div>
  </footer>
);

const Index = () => {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      <Hero />

      <div className="w-full bg-background">
        {/* Scanner */}
        <AllergenScanner />

        {/* Divisor */}
        <div className="w-full max-w-4xl mx-auto my-6 px-4">
          <div className="h-px bg-border" />
        </div>

        {/* Busca por nome */}
        <AllergenFreeSearch />

        <Footer />
      </div>
    </motion.main>
  );
};

export default Index;
