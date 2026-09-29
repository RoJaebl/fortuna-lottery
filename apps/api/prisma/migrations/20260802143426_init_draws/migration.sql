-- CreateTable
CREATE TABLE "draws" (
    "round" INTEGER NOT NULL,
    "n1" INTEGER NOT NULL,
    "n2" INTEGER NOT NULL,
    "n3" INTEGER NOT NULL,
    "n4" INTEGER NOT NULL,
    "n5" INTEGER NOT NULL,
    "n6" INTEGER NOT NULL,
    "bonus" INTEGER NOT NULL,
    "drawn_at" DATE NOT NULL,

    CONSTRAINT "draws_pkey" PRIMARY KEY ("round")
);
