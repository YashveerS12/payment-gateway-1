package com.paymentgateway.recon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ReconServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ReconServiceApplication.class, args);
    }
}
