//! Prover Performance Benchmarks

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use phantom_prover::{shield, unshield, private_swap, compliance};

fn bench_shield_proof_generation(c: &mut Criterion) {
    c.bench_function("shield_proof_generation", |b| {
        b.iter(|| {
            // Benchmark shield proof generation
            // Target: < 1500ms in WASM
            shield::prove_shield(
                black_box("0xcommitment"),
                black_box(0u8),
                black_box("0xamount"),
                black_box("0xsecret"),
                black_box("0xsalt"),
            )
        })
    });
}

fn bench_unshield_proof_generation(c: &mut Criterion) {
    c.bench_function("unshield_proof_generation", |b| {
        b.iter(|| {
            // Benchmark unshield proof generation
            // Target: < 2500ms in WASM
            unshield::prove_unshield(
                black_box("0xnullifier"),
                black_box(None),
                black_box("0xroot"),
                black_box(vec![]),
            )
        })
    });
}

fn bench_private_swap_proof_generation(c: &mut Criterion) {
    c.bench_function("private_swap_proof_generation", |b| {
        b.iter(|| {
            // Benchmark private swap proof generation
            // Target: < 4000ms in WASM
            private_swap::prove_swap(
                black_box("0xnullifier_in"),
                black_box("0xcommitment_out"),
                black_box("0xroot"),
                black_box("0xinput"),
                black_box("0xoutput"),
            )
        })
    });
}

fn bench_compliance_bundle_generation(c: &mut Criterion) {
    c.bench_function("compliance_bundle_generation", |b| {
        b.iter(|| {
            // Benchmark compliance proof bundle
            // Target: < 6000ms in WASM
            compliance::prove_bundle(
                black_box("0xregulator"),
                black_box(0u8),
                black_box("0xkyc_root"),
                black_box("0xkyc_commitment"),
            )
        })
    });
}

fn bench_poseidon_hash(c: &mut Criterion) {
    let mut group = c.benchmark_group("poseidon_hash");
    
    for size in [1, 10, 100, 1000] {
        group.bench_with_input(BenchmarkId::from_parameter(size), &size, |b, &size| {
            b.iter(|| {
                for _ in 0..size {
                    black_box(shield::poseidon_hash(
                        black_box("0xleft"),
                        black_box("0xright"),
                    ));
                }
            })
        });
    }
    
    group.finish();
}

criterion_group!(
    benches,
    bench_shield_proof_generation,
    bench_unshield_proof_generation,
    bench_private_swap_proof_generation,
    bench_compliance_bundle_generation,
    bench_poseidon_hash,
);

criterion_main!(benches);
