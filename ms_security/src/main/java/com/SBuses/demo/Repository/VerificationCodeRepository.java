package com.SBuses.demo.Repository;

import com.SBuses.demo.Models.VerificationCode;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VerificationCodeRepository extends MongoRepository<VerificationCode, String> {
    Optional<VerificationCode> findByUserIdAndUsedFalse(String userId);
}
