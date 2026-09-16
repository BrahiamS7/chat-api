-- CreateTable
CREATE TABLE "TokenRevocado" (
    "id" SERIAL NOT NULL,
    "jti" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenRevocado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenRevocado_jti_key" ON "TokenRevocado"("jti");
