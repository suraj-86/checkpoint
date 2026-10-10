package com.checkpoint.interest.service;

import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.interest.dto.InterestsResponse;
import com.checkpoint.interest.repository.UserInterestRepository;
import com.checkpoint.topic.entity.Topic;
import com.checkpoint.topic.repository.TopicRepository;
import com.checkpoint.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InterestServiceTest {

    @Mock
    private UserInterestRepository interestRepository;

    @Mock
    private TopicRepository topicRepository;

    private final User user = User.builder().id(UUID.randomUUID()).username("student").build();

    private InterestService service() {
        return new InterestService(interestRepository, topicRepository);
    }

    @Test
    void replaceSavesDistinctTopicsInTheOrderGiven() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        when(topicRepository.findAllById(any())).thenReturn(List.of(
                Topic.builder().id(a).name("A").build(), Topic.builder().id(b).name("B").build()));

        InterestsResponse response = service().replace(user, List.of(a, b, a));

        verify(interestRepository).replaceAll(eq(user.getId()), argThat(ids -> List.copyOf(ids).equals(List.of(a, b))));
        assertThat(response.topicIds()).containsExactly(a, b);
    }

    @Test
    void replaceRejectsTopicsThatDoNotExist() {
        when(topicRepository.findAllById(any())).thenReturn(List.of());

        assertThatThrownBy(() -> service().replace(user, List.of(UUID.randomUUID())))
                .isInstanceOf(BadRequestException.class);

        verify(interestRepository, never()).replaceAll(any(), any());
    }

    @Test
    void replaceWithEmptyListClearsInterestsWithoutLookingUpTopics() {
        InterestsResponse response = service().replace(user, List.of());

        verify(interestRepository).replaceAll(any(), any());
        verifyNoInteractions(topicRepository);
        assertThat(response.topicIds()).isEmpty();
    }

    @Test
    void getReturnsTheSavedTopicIds() {
        UUID a = UUID.randomUUID();
        when(interestRepository.findTopicIds(user.getId())).thenReturn(new LinkedHashSet<>(List.of(a)));

        assertThat(service().get(user).topicIds()).containsExactly(a);
    }
}
