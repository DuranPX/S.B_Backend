package com.SBuses.demo.Repository;

import com.SBuses.demo.Models.RecoveryToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecoveryTokenRepository extends MongoRepository<RecoveryToken, String> {
    Optional<RecoveryToken> findByEmailAndUsedFalse(String email);
}
